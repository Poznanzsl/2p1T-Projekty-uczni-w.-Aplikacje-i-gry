# Nudge
## ~~Pomysły na gry~~
~~saper, sudoku, memory, tetris, statki, ruletka, labirynt, pacman, snake, wordle~~

## Planowane gry
- memory
- sudoku
- saper
- pacman (będzie trzeba użyć innej nazwy np. pak)
- statki
- snake

## Podział
1. Wrapper (home page + login + user data SDK) - maciej (prawie gotowy)
2. memory - marcin (nie zaczęto)
3. sudoku - hubert (nie zaczęto)
4. saper - hubert (gotowy)
5. pacman - maciej (nie zaczęto)
6. statki - ? (nie zaczęto)
7. snake - ? (nie zaczęto)

## Jak i gdzie tworzyć gry
Gry mozecie pisac w htmlu i zapisywac w public/games/, kazda gra musi miec swoj wlasny folder np. public/games/saper i w nim wszystkie pliki z nia zwiazane, nazwa plikow niewazna na koncu to jakos razem zepniemy na stronie glownej.

Gry powinny posiadać jakiś rodzaj zapisywania danych w chmurze (powiązane z kontem użytkownika, high scores, ustawienia). Dane możecie zapisywać przy użyciu biblioteki w public/api-sdk.js w ten sposób:
```html
<script src="/api-sdk.js"></script> <!-- Import biblioteki -->

<script>
    const api = new GameStorage("saper"); // Inicjacja storage, trzeba podać ID gry (czyli np. saper, sudoku, statki)
    
    await storage.init(); // Opcjonalna, ale zalecana dla szybszej pracy wstępna inicjacja i caching magazynu. Powinno być wykonnane tylko raz.

    await storage.setItem('playerName', 'John Doe');
    const playerName = await storage.getItem('playerName'); // 'John Doe'
</script>
```
Szczegółowe przykłady (zapisywanie list, obiektów) znajdziecie na dole pliku biblioteki.

## Odpalanie serwera (strony głównej, logowania oraz API GameStorage)
**Uwaga:** To jest konieczne tylko, jeśli jesteście już na etapie integracji z naszym API i systemem logowania, jeśli jeszcze tego nie zaczęliście wystarczy otworzyć plik HTML waszej gry.
- Miec zainstalowany Node.js
- Otworzyc terminal w roocie projektu
- `npm i`
- Utworzyć i wypełnić plik `.env.local`, poproście o niego na grupie.
- `npm run dev`
- Wejsc na `localhost:3000` w przeglądarce