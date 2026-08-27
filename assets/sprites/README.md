# Sprites

El juego funciona sin ningun archivo aca: si un PNG no existe, el personaje se dibuja
procedural con canvas. Cada imagen que agregues reemplaza a su version procedural
automaticamente, sin tocar codigo.

## Como agregar uno

1. Genera la imagen.
2. Guardala en esta carpeta como `<nombre>.png`, con el nombre exacto de la tabla.
3. Recarga el juego.

Requisitos tecnicos:

- **PNG con fondo transparente.**
- Personaje **mirando a la derecha** (el juego lo espeja solo cuando mira a la izquierda).
- Alto util ~512 px, el personaje ocupando todo el alto, parado sobre el borde inferior.
- Sin sombra ni piso dibujados: el juego pone la sombra.

> Servido por `file://` el navegador bloquea la carga de estos PNG.
> Para verlos hay que levantar el server local (`python -m http.server`).

## Nombres esperados

| Archivo | Personaje |
|---|---|
| `goku.png` | Goku (base) |
| `krilin.png` | Krilin |
| `bulma.png` | Bulma |
| `roshi.png` | Maestro Roshi |
| `piccolo.png` | Piccolo |
| `gohan.png` | Gohan |
| `vegeta.png` | Vegeta |
| `yamcha.png` `ten.png` `chaos.png` | secundarios |
| `karin.png` `kamisama.png` `milk.png` `trunks.png` `a18.png` | secundarios |
| `saibaman.png` `soldado.png` | enemigos comunes |
| `raditz.png` `nappa.png` `freezer.png` `cell.png` `buu.png` | jefes clasicos |
| `draken.png` `nerva.png` `ozmar.png` `velk.png` `hueco.png` | enemigos originales |

## Prompts

Base comun para todos (pegar al final de cada prompt):

> full body character sprite, facing right, side view, standing idle pose,
> flat cel-shaded anime style, bold black outlines, vibrant saturated colors,
> transparent background, no shadow, no ground, no background elements,
> centered, full figure from head to feet

Y despues el personaje:

- **goku** — spiky black-haired martial artist, orange gi with blue belt and blue undershirt, blue wristbands, dark boots, confident stance
- **krilin** — short bald monk with six dots on forehead, orange gi with blue belt, small stature
- **bulma** — young woman with short blue hair, pink sleeveless top, white shorts, boots
- **roshi** — old man, bald with long white beard and mustache, dark sunglasses, white shirt with red trim, wooden staff
- **piccolo** — tall green-skinned alien warrior, pointed ears, two antennae, purple gi with red belt, white cape and white turban
- **gohan** — young boy, spiky black hair, orange gi with blue belt, smaller proportions than an adult
- **vegeta** — proud warrior with flame-shaped upswept black hair, blue bodysuit with white armor chestplate, white gloves and boots, arms crossed
- **saibaman** — small green humanoid creature, bulbous head, large red eyes, thin limbs, hunched posture
- **soldado** — alien foot soldier in purple bodysuit with white battle armor and a green scouter over one eye

Enemigos originales (no existen en el anime, inventalos):

- **draken** — tall lean alien bounty hunter, dark navy armored bodysuit with glowing cyan circuit lines, sharp angular helmet with a single cyan visor, long cape, cold predatory posture
- **nerva** — slender female alien scientist-warrior, deep purple skin, long pale hair, elegant dark battle dress with glowing violet energy siphons on both forearms
- **ozmar** — massive hulking stone-skinned brute, brown rocky armored plates, small glowing amber eyes, enormous fists, heavy grounded stance
- **velk** — small fast insectoid alien scout, teal carapace, four thin arms, large pale compound eyes, crouched ready-to-dash pose
- **hueco** — faceless humanoid made of dark grey shifting matter, a smooth blank head with two glowing white eyes, cracked surface

## Transformaciones

**No hace falta un PNG por transformacion.** El pelo, el color de ojos y el aura de cada
forma los dibuja el codigo por encima. Si mas adelante queres arte especifico por forma,
ahi si conviene abrir un sprite por transformacion (`goku_ssj1.png`, etc.) y ampliar
`Sprites` en `js/sprites.js`.
