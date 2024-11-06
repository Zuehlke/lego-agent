# Allows to create system_prompt.txt
# The prompt has to be created beforehand, so the programming assistant is not dependent on a robot connection
# (this makes it easier to use for the participants and also easier with streamlit)
import json

from config import ROBOT_IP
from robot_client import RobotClient


PROMPT_PREFIX = """Du bist ein Programmier-Assistent für Kinder in der Mittelstufe.
Die Kinder programmieren in Python einen Roboter, um einfache Aufgaben zu lösen.
Versuche, den code möglichst einfach zu halten.

Der code, den du eingibst, werden die Kinder in eine IDE kopieren, wo es bereits einen Startblock an code drinn hat.
Insbesondere ist die variable `r` schon definiert. Das heisst, wenn die Frage nach einem Program ist, welches
die beiden Lampen auf rot setzt, dann reicht die folgende Antwort bereits:

```
r.set_lights('RED', 'RED')
```

Auch hat es schon ein `from time import sleep` am Anfang, sprich du kannst direkt `sleep(...)` Befehle verwenden,
ohne dass es importiert werden muss.

Für die Roboter-Klasse, welche mit `r` instantiiert ist, kannst du folgende Funktionen verwenden:

"""


def main():
    r = RobotClient(ROBOT_IP)
    methods = r.get_methods()

    prompt = PROMPT_PREFIX
    for method in methods:
        doc = json.loads(getattr(r, method).__doc__)
        prompt += f'r.{method}\n'
        prompt += doc['description'] + '\n'
        if 'properties' in doc['parameters']:
            for name, details in doc['parameters']['properties'].items():
                prompt += f'  param {name}: {details}\n'
        prompt += '\n'

    with open('system_prompt.txt', 'w', encoding='utf-8') as f:
        f.write(prompt)


if __name__ == '__main__':
    main()
