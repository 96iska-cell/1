import os
import sys
import json
import urllib.request

prompt = sys.argv[1]

with open("fbsayt.html", "r", encoding="utf-8") as f:
    current_html = f.read()

instruction = f"""
Ты AI-агент, который редактирует HTML-сайт.

Задача пользователя:
{prompt}

Текущий index.html:
{current_html}

Верни полный новый index.html.
Верни только HTML-код.
Не используй Markdown и ``` .
Не объясняй изменения.
"""

data = json.dumps({
    "model": "gpt-5.6",
    "input": instruction
}).encode("utf-8")

request = urllib.request.Request(
    "https://api.openai.com/v1/responses",
    data=data,
    headers={
        "Content-Type": "application/json",
        "Authorization": "Bearer " + os.environ["OPENAI_API_KEY"]
    }
)

with urllib.request.urlopen(request) as response:
    result = json.loads(response.read().decode("utf-8"))

new_html = ""

for output in result["output"]:
    if output["type"] == "message":
        for item in output["content"]:
            if item["type"] == "output_text":
                new_html += item["text"]

if not new_html.strip():
    raise RuntimeError("OpenAI не вернул HTML")

with open("fbsayt.html", "w", encoding="utf-8") as f:
    f.write(new_html)
