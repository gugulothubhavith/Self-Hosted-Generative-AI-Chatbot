from pydantic import BaseModel
from typing import Optional

class CodeGenerateRequest(BaseModel):
    language: str
    prompt: str
    use_agents: Optional[bool] = False

class CodeRefactorRequest(BaseModel):
    language: str
    goal: str
    code: str

class CodeExplainRequest(BaseModel):
    language: str
    code: str

class CodeTestRequest(BaseModel):
    language: str
    code: str

class CodeExecuteRequest(BaseModel):
    language: str
    code: str

class CodeResponse(BaseModel):
    result: str