import os

with open("src/app/teams/[id]/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

with open("new_ui.txt", "r", encoding="utf-8") as f:
    new_ui = f.read()

start_idx = code.find("\n  return (")

if start_idx != -1:
    new_code = code[:start_idx] + new_ui
    with open("src/app/teams/[id]/page.tsx", "w", encoding="utf-8") as f:
        f.write(new_code)
    print("UI Replaced!")
else:
    print("Could not find start idx")
