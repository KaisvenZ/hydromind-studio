from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from models import get_session, Annotation, User
from auth import get_current_user, require_role

router = APIRouter(prefix="/api/annotations", tags=["annotations"])


class AnnotationCreate(BaseModel):
    snapshot_id: str
    content: str


class AnnotationResponse(BaseModel):
    id: int
    snapshot_id: str
    user_id: int
    role: str
    content: str
    created_at: str


@router.get("", response_model=list[AnnotationResponse])
def list_annotations(snapshot_id: str | None = None, user: dict = Depends(get_current_user)):
    with get_session() as s:
        q = s.query(Annotation).order_by(Annotation.created_at.asc())
        if snapshot_id:
            q = q.filter(Annotation.snapshot_id == snapshot_id)
        return [a.to_dict() for a in q.all()]


@router.post("", response_model=AnnotationResponse, status_code=status.HTTP_201_CREATED)
def create_annotation(body: AnnotationCreate, user: dict = Depends(require_role("engineer"))):
    with get_session() as s:
        u = s.query(User).filter_by(username=user["username"]).first()
        ann = Annotation(
            snapshot_id=body.snapshot_id,
            user_id=u.id if u else 1,
            role=user["role"],
            content=body.content,
        )
        s.add(ann)
        s.commit()
        s.refresh(ann)
        return ann.to_dict()


@router.delete("/{annotation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_annotation(annotation_id: int, user: dict = Depends(get_current_user)):
    with get_session() as s:
        ann = s.query(Annotation).filter_by(id=annotation_id).first()
        if not ann:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Annotation not found")
        current = s.query(User).filter_by(username=user["username"]).first()
        is_author = current and ann.user_id == current.id
        if user["role"] != "commander" and not is_author:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only commander or author can delete")
        s.delete(ann)
        s.commit()
