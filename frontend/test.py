with open('update_ui.py') as f:
    text = f.read()

start = text.find('return (')
end = text.find('"""\n\nstart_idx')
with open('test_ui.tsx', 'w') as f:
    f.write('export default function Test() {\n' + text[start:end] + '\n}\n')
