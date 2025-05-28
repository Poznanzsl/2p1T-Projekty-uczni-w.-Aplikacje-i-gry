# Nudge
## Projekt
Szczegóły projektu i podział zadań znajduje się [tutaj](https://spark-emperor-61a.notion.site/Analiza-SWOT-i-struktura-projektu-Nudge-201064adec3a80638919e9e0b9ea066d?pvs=4)

## Jak i gdzie tworzyć gry
Gry mozecie pisac w htmlu i zapisywac w public/games/, kazda gra musi miec swoj wlasny folder np. public/games/saper i w nim wszystkie pliki z nia zwiazane, nazwa plikow niewazna na koncu to jakos razem zepniemy na stronie glownej.

Gry powinny posiadać jakiś rodzaj zapisywania danych w chmurze (powiązane z kontem użytkownika, high scores, ustawienia). Dane możecie zapisywać przy użyciu biblioteki w public/api-sdk.js w ten sposób:
```html
<script src="/api-sdk.js"></script> <!-- Import biblioteki -->

<script>
    // Przed użyciem GameStorage przydatne jest sprawdzenie czy użytkownik jest zalogowany (nie musi być).
    if (!isUserLoggedIn()) {
        console.log("Please log in!");
    }

    const api = new GameStorage("saper"); // Inicjacja storage, trzeba podać ID gry (czyli np. saper, sudoku, statki)
    
    await storage.init(); // Opcjonalna, ale zalecana dla szybszej pracy wstępna inicjacja i caching magazynu. Powinno być wykonnane tylko raz.

    await storage.setItem('playerName', 'John Doe');
    const playerName = await storage.getItem('playerName'); // 'John Doe'

    // Jeżeli użytkownik nie jest zalogowany, dane są zapisywane lokalnie w sesji.
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