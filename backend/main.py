from langgraph.graph import StateGraph,START,END
from typing import TypedDict
from dotenv import load_dotenv
from fastapi import FastAPI
from langchain_groq import ChatGroq
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import json
from typing import Any
import uuid
from fastapi import UploadFile, File
from pypdf import PdfReader
import io

load_dotenv()

app = FastAPI()

primary_llm = ChatGroq(model= "llama-3.3-70b-versatile" , temperature= 0)
secondary_llm = ChatGroq(model = "llama-3.1-8b-instant" , temperature=0)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Request_Format(BaseModel):
    pdf_id : str
    question : str

class State(TypedDict):
    pdf_content : str
    pdf_id : str
    summary : Any
    question : str
    answer : str

def load_summary(pdf_id):

    path = f"summaries/{pdf_id}.json"

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_summary(summary):

    file_id = str(uuid.uuid4())

    path = f"summaries/{file_id}.json"

    with open(path,"w",encoding="utf-8") as f:
        json.dump(summary,f,indent=5,ensure_ascii=False)

    return file_id

async def summarize_node(state : State):

    response = await secondary_llm.ainvoke(
            f"""
        Summarize this document into valid JSON.

        Return ONLY JSON.

        Format:

        {{
            "summary": "short summary here"
        }}

        Document:
        {state["pdf_content"][:10000]}
        """
    )

    summary = json.loads(response.content)

    pdf_id = save_summary(summary)

    return {
        "pdf_id" : pdf_id
    }
    
async def chat_node(state: State):
    
    response = await primary_llm.ainvoke(
        f"""
        You are a restricted document assistant.

        You know absolutely nothing except the supplied context.

        Rules:
        1. Use only the provided context.
        2. Never use outside knowledge.
        3. Never infer missing information.
        4. Never answer from general knowledge.
        5. If the answer is not explicitly stated or clearly supported by the context, reply exactly:

        I cannot find that information in the uploaded PDF.

        Context:
        {state["summary"]}

        Question:
        {state["question"]}
        """
    )

    return {
        "answer" : response.content
    }


upload_graph = StateGraph(State)

upload_graph.add_node("summarize",summarize_node)

upload_graph.add_edge(START,"summarize")
upload_graph.add_edge("summarize",END)

upload_workflow = upload_graph.compile()

chat_graph = StateGraph(State)

chat_graph.add_node("chat", chat_node)

chat_graph.add_edge(START,"chat")
chat_graph.add_edge("chat",END)

chat_workflow = chat_graph.compile()


@app.post("/chat")
async def pdf_chat(req : Request_Format):

    summary = load_summary(req.pdf_id)

    response = await chat_workflow.ainvoke({
        "summary" : summary,
        "question" : req.question
    })

    return {
        "answer" : response["answer"]
    }

@app.post("/upload")
async def upload_chat(files : list[UploadFile] = File(...)):
        combined_text = ""

        for file in files:
            pdf_bytes = await file.read()

            reader =  PdfReader(io.BytesIO(pdf_bytes))

            for page in reader.pages:
                text = page.extract_text()

                if text:
                    combined_text += text + "\n"

        response = await upload_workflow.ainvoke({
            "pdf_content": combined_text
        })

        return {
            "pdf_id" : response["pdf_id"]
        }