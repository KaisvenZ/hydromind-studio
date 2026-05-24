import os
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from httpx import AsyncClient
from models import get_session, AuditEntry
from auth import get_current_user, require_role

router = APIRouter(prefix="/api/ai", tags=["ai"])

OPENAI_URL = "https://api.openai.com/v1/responses"
API_KEY = os.getenv("OPENAI_API_KEY", "")


class BriefingRequest(BaseModel):
    mode: str = "local"
    markdown_input: str
    model: str = "gpt-4o"
    template: str = "command-summary"
    language: str = "zh-CN"


class BriefingResponse(BaseModel):
    source: str  # "local" | "remote"
    markdown: str


TEMPLATE_INSTRUCTIONS = {
    "command-summary": "Produce a concise command summary with risk, evidence, and recommended dispatch actions.",
    "executive-memo": "Produce a polished executive memo with situation, implications, decision needs, and caveats.",
    "field-checklist": "Produce a field checklist with checkbox actions, timing, and verification notes.",
}


def build_local_briefing(request: BriefingRequest) -> str:
    lang = request.language
    if lang == "zh-CN":
        return f"## 服务端本地研判\n\n输入：{request.markdown_input[:200]}...\n\n> 远端模型未配置 API Key，使用本地规则生成。"
    return f"## Server-side Local Briefing\n\nInput: {request.markdown_input[:200]}...\n\n> Remote model not configured; local rules used."


@router.post("/briefing", response_model=BriefingResponse)
async def generate_briefing(body: BriefingRequest, user: dict = Depends(require_role("hydrologist"))):
    # Record audit
    with get_session() as s:
        s.add(AuditEntry(user_id=1, action_type="ai_briefing", detail=f"User {user['username']} requested {body.template}"))
        s.commit()

    if body.mode != "remote" or not API_KEY:
        return BriefingResponse(source="local", markdown=build_local_briefing(body))

    instruction = TEMPLATE_INSTRUCTIONS.get(body.template, TEMPLATE_INSTRUCTIONS["command-summary"])

    async with AsyncClient(timeout=30) as client:
        try:
            resp = await client.post(
                OPENAI_URL,
                headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
                json={
                    "model": body.model,
                    "instructions": f"You are a flood-control decision-support analyst. {instruction} Include a disclaimer that this is not an official operational command.",
                    "input": body.markdown_input,
                    "max_output_tokens": 650,
                },
            )
            if resp.is_success:
                data = resp.json()
                text = data.get("output_text", "").strip() or (
                    data.get("output", [{}])[0].get("content", [{}])[0].get("text", "").strip()
                )
                if text:
                    return BriefingResponse(source="remote", markdown=text)
        except Exception:
            pass

    return BriefingResponse(source="local", markdown=build_local_briefing(body))
