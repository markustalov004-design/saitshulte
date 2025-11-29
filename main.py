from fastapi import FastAPI, Request, Form
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from datetime import datetime
import json

app = FastAPI()

templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

game_results = {
    "schulte": [],
    "gonogo": {"correct": 0, "errors": 0, "total": 0},
    "traffic": {"correct": 0, "errors": 0, "total": 0}
}

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/save_schulte_result")
async def save_schulte_result(time: int = Form(...)):
    game_results["schulte"].append({
        "time": time,
        "timestamp": datetime.now().isoformat()
    })
    return {"status": "success"}

@app.post("/save_game_result")
async def save_game_result(game_type: str = Form(...), correct: int = Form(...), errors: int = Form(...)):
    if game_type in ["gonogo", "traffic"]:
        game_results[game_type] = {
            "correct": correct,
            "errors": errors,
            "total": correct + errors,
            "timestamp": datetime.now().isoformat()
        }
    return {"status": "success"}

@app.get("/get_results")
async def get_results():
    return game_results

@app.post("/reset_results")
async def reset_results():
    global game_results
    game_results = {
        "schulte": [],
        "gonogo": {"correct": 0, "errors": 0, "total": 0},
        "traffic": {"correct": 0, "errors": 0, "total": 0}
    }
    return {"status": "success"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)