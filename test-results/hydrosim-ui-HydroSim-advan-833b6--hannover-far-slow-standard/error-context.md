# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: hydrosim-ui.spec.js >> HydroSim advanced-mode and scenario coverage >> scenario-controls-hannover-far-slow-standard
- Location: tests/ui/hydrosim-ui.spec.js:135:5

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: page.selectOption: Test timeout of 120000ms exceeded.
Call log:
  - waiting for locator('#hs-profile')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e6]:
        - link "basemap.de 3D — DGM5 + LoD2" [ref=e7] [cursor=pointer]:
          - /url: https://basemap.de/produkte-und-dienste/3d/
          - img "basemap.de 3D — DGM5 + LoD2" [ref=e8]
          - heading [level=1]
        - generic [ref=e10]:
          - searchbox "Suche nach Adresse" [ref=e11]
          - button "Suche nach Adresse" [disabled]:
            - img: 
      - generic [ref=e13]:
        - list [ref=e15]:
          - listitem [ref=e16]:
            - generic [ref=e18]:
              - button " LGLN DOP20 (WMS — CORS blocked, needs proxy)" [ref=e20] [cursor=pointer]:
                - generic [ref=e21]: 
                - generic "LGLN DOP20 (WMS — CORS blocked, needs proxy)" [ref=e22]:
                  - generic [ref=e23]: LGLN DOP20 (WMS — CORS blocked, needs proxy)
              - generic [ref=e24]:
                - button "Weitere Funktionen anzeigen" [ref=e27] [cursor=pointer]:
                  - img [ref=e28]: 
                - button "Informationen zum Datensatz anzeigen" [ref=e31] [cursor=pointer]:
                  - img [ref=e32]: 
          - listitem
          - listitem
          - listitem
          - listitem [ref=e33]:
            - generic [ref=e35]:
              - button " TopPlusOpen" [ref=e37] [cursor=pointer]:
                - generic [ref=e38]: 
                - generic "TopPlusOpen" [ref=e39]:
                  - generic [ref=e40]: TopPlusOpen
              - generic [ref=e41]:
                - button "Weitere Funktionen anzeigen" [ref=e44] [cursor=pointer]:
                  - img [ref=e45]: 
                - button "Informationen zum Datensatz anzeigen" [ref=e48] [cursor=pointer]:
                  - img [ref=e49]: 
        - separator [ref=e50]
        - generic [ref=e51]:
          - button "Über dieses Portal" [ref=e53] [cursor=pointer]:
            - img [ref=e54]: 
            - generic [ref=e56]: Über dieses Portal
          - button "Sprache ändern" [ref=e58] [cursor=pointer]:
            - img [ref=e59]: 
            - generic [ref=e61]: Sprache ändern
        - separator [ref=e62]
      - button "⋮" [ref=e63]
    - button "menu.name öffnen" [ref=e64] [cursor=pointer]:
      - generic [ref=e65]: 
    - generic:
      - group:
        - generic:
          - generic:
            - button "" [ref=e66] [cursor=pointer]:
              - generic [ref=e67]: 
            - button "" [ref=e68] [cursor=pointer]:
              - generic [ref=e69]: 
        - button "" [ref=e70] [cursor=pointer]:
          - generic [ref=e71]: 
        - generic:
          - generic:
            - button "" [disabled]:
              - generic: 
        - generic:
          - generic:
            - button "" [ref=e72] [cursor=pointer]:
              - generic [ref=e73]: 
            - button "" [ref=e74] [cursor=pointer]:
              - generic [ref=e75]: 
            - button "" [ref=e76] [cursor=pointer]:
              - generic [ref=e77]: 
      - contentinfo [ref=e78]:
        - button "Impressum" [ref=e79] [cursor=pointer]
        - generic "Skalierung der Karte" [ref=e81]:
          - text: "1 : 40.000"
          - generic [ref=e82]: 800 m
    - button "menu.name öffnen" [ref=e83] [cursor=pointer]:
      - generic [ref=e84]: 
    - generic:
      - generic:
        - generic:
          - generic:
            - button "Legende" [ref=e85] [cursor=pointer]:
              - img: 
              - generic [ref=e86]:
                - generic [ref=e87]: Legende
                - generic [ref=e88]: Erhalten Sie Informationen zu den Objekten in der Karte
            - button "Auswahl teilen" [ref=e89] [cursor=pointer]:
              - img: 
              - generic [ref=e90]:
                - generic [ref=e91]: Auswahl teilen
                - generic [ref=e92]: Teilen Sie einen Link zur Karte
          - separator
      - button "⋮" [ref=e93]
  - button "" [active] [ref=e100] [cursor=pointer]:
    - generic [ref=e101]: 
  - generic [ref=e102]:
    - generic [ref=e103]:
      - generic [ref=e104]:
        - generic [ref=e105]: 
        - text: Hochwassersimulation
      - button "×" [ref=e106] [cursor=pointer]
    - generic [ref=e107]:
      - generic [ref=e108]:
        - generic [ref=e109]: Überflutungsgebiet
        - button " Polygon zeichnen" [disabled] [ref=e110]:
          - generic [ref=e111]: 
          - generic [ref=e112]: Polygon zeichnen
      - generic [ref=e113]:
        - generic [ref=e114]: Modus
        - combobox [ref=e115]:
          - option "Automatik (empfohlen)" [selected]
          - option "Starkregen"
          - option "Sturzflut"
          - option "Fluss"
        - generic [ref=e116]: Automatik wählt den Ereignistyp anhand von Volumen und Dauer.
      - generic [ref=e117]:
        - generic [ref=e118]:
          - text: Wasservolumen
          - generic [ref=e119]: 50000 m³
        - slider [ref=e120] [cursor=pointer]: "50000"
      - generic [ref=e121]:
        - generic [ref=e122]:
          - text: Ereignisdauer
          - generic [ref=e123]: 30 min
        - slider [ref=e124] [cursor=pointer]: "30"
      - generic [ref=e125]:
        - generic [ref=e126]:
          - text: Simulationsgeschwindigkeit
          - generic [ref=e127]: 8×
        - slider [ref=e128] [cursor=pointer]: "8"
      - generic [ref=e129]:
        - button " Starten" [disabled] [ref=e130]:
          - generic [ref=e131]: 
          - text: Starten
        - button " Pause" [disabled] [ref=e132]:
          - generic [ref=e133]: 
          - text: Pause
        - button " Reset" [ref=e134] [cursor=pointer]:
          - generic [ref=e135]: 
          - text: Reset
      - generic [ref=e136]:
        - generic [ref=e137]: 
        - text: Für HydroSim näher heranzoomen (Kamerahöhe < 8000 m).
      - text: 
      - generic [ref=e138]:
        - generic [ref=e139]:
          - generic [ref=e140]: 
          - text: Schutzmaßnahmen
        - generic [ref=e141]:
          - generic [ref=e142]:
            - generic [ref=e143]: 
            - text: Pumpen aktiv
          - checkbox " Pumpen aktiv" [ref=e144]
        - generic [ref=e145]:
          - generic [ref=e146]:
            - generic [ref=e147]: 
            - text: Mobile Deiche
          - checkbox " Mobile Deiche" [ref=e148]
        - generic [ref=e149]:
          - generic [ref=e150]:
            - generic [ref=e151]: 
            - text: Retentionsflächen
          - checkbox " Retentionsflächen" [ref=e152]
        - generic [ref=e153]:
          - text: Maßnahmen-Intensität
          - generic [ref=e154]: 40%
        - slider [ref=e155] [cursor=pointer]: "40"
        - generic [ref=e156]: Wirkt auf Zuflussreduktion und Fließwiderstand in der Simulation.
      - generic [ref=e157]:
        - generic [ref=e158]:
          - generic [ref=e159]: 
          - text: Analyse-Layer
        - generic [ref=e160]:
          - text: Weitere Analyse
          - generic [ref=e161]: 0 Layer
        - combobox [ref=e162]:
          - option "Zur aktiven Analyse hinzufügen" [selected]
          - option "Neue Analyse-Layer erstellen"
        - generic [ref=e163]:
          - combobox [ref=e164]:
            - option "Keine Analyse vorhanden" [selected]
          - button "" [disabled] [ref=e165]:
            - generic [ref=e166]: 
        - button " Ergebnis als GeoJSON exportieren" [disabled] [ref=e168]:
          - generic [ref=e169]: 
          - text: Ergebnis als GeoJSON exportieren
```

# Test source

```ts
  1   | import { expect, test } from '@playwright/test';
  2   | 
  3   | async function openHydroPanel(page) {
  4   |   await page.goto('/');
  5   |   await page.waitForSelector('#hydrosim-trigger', { timeout: 60000 });
  6   |   await page.click('#hydrosim-trigger');
  7   |   await page.waitForSelector('#hydrosim-panel.visible');
  8   | }
  9   | 
  10  | async function setScenario(page, scenario) {
> 11  |   await page.selectOption('#hs-profile', scenario.profile);
      |              ^ Error: page.selectOption: Test timeout of 120000ms exceeded.
  12  |   await page.selectOption('#hs-mode', scenario.mode);
  13  |   await page.evaluate(({ volume, durationMin, speed, measureLevel }) => {
  14  |     const setRange = (id, value) => {
  15  |       const el = document.querySelector(id);
  16  |       if (!el) return;
  17  |       el.value = String(value);
  18  |       el.dispatchEvent(new Event('input', { bubbles: true }));
  19  |       el.dispatchEvent(new Event('change', { bubbles: true }));
  20  |     };
  21  |     setRange('#hs-volume', volume);
  22  |     setRange('#hs-duration', durationMin);
  23  |     setRange('#hs-speed', speed);
  24  |     setRange('#hs-measure-level', measureLevel);
  25  |   }, scenario);
  26  | 
  27  |   await page.setChecked('#hs-measure-pump', !!scenario.pump);
  28  |   await page.setChecked('#hs-measure-dike', !!scenario.dike);
  29  |   await page.setChecked('#hs-measure-retention', !!scenario.retention);
  30  | }
  31  | 
  32  | async function setCameraHeight(page, targetHeightM) {
  33  |   await page.evaluate(async (targetHeight) => {
  34  |     const scene = window.HydroSim?.getScene?.();
  35  |     if (!scene || !window.Cesium) return;
  36  |     const center = scene.camera.positionCartographic;
  37  |     scene.camera.setView({
  38  |       destination: window.Cesium.Cartesian3.fromRadians(
  39  |         center.longitude,
  40  |         center.latitude,
  41  |         targetHeight
  42  |       )
  43  |     });
  44  |     await new Promise(resolve => setTimeout(resolve, 300));
  45  |   }, targetHeightM);
  46  | }
  47  | 
  48  | async function setCameraByLocation(page, lon, lat, height) {
  49  |   await page.evaluate(async ({ lon, lat, height }) => {
  50  |     const scene = window.HydroSim?.getScene?.();
  51  |     if (!scene || !window.Cesium) return;
  52  |     scene.camera.flyTo({
  53  |       destination: window.Cesium.Cartesian3.fromDegrees(lon, lat, height),
  54  |       duration: 0.2
  55  |     });
  56  |     await new Promise(resolve => setTimeout(resolve, 500));
  57  |   }, { lon, lat, height });
  58  | }
  59  | 
  60  | const scenarios = [
  61  |   {
  62  |     name: 'hannover-close-quick-advanced',
  63  |     lon: 9.74,
  64  |     lat: 52.37,
  65  |     profile: 'advanced',
  66  |     mode: 'flash',
  67  |     volume: 350000,
  68  |     durationMin: 20,
  69  |     speed: 24,
  70  |     pump: true,
  71  |     dike: true,
  72  |     retention: false,
  73  |     measureLevel: 80,
  74  |     cameraHeight: 1800
  75  |   },
  76  |   {
  77  |     name: 'hannover-far-slow-standard',
  78  |     lon: 9.74,
  79  |     lat: 52.37,
  80  |     profile: 'standard',
  81  |     mode: 'auto',
  82  |     volume: 90000,
  83  |     durationMin: 90,
  84  |     speed: 4,
  85  |     pump: false,
  86  |     dike: false,
  87  |     retention: true,
  88  |     measureLevel: 45,
  89  |     cameraHeight: 12000
  90  |   },
  91  |   {
  92  |     name: 'harz-close-quick-advanced',
  93  |     lon: 10.6,
  94  |     lat: 51.75,
  95  |     profile: 'advanced',
  96  |     mode: 'river',
  97  |     volume: 650000,
  98  |     durationMin: 25,
  99  |     speed: 32,
  100 |     pump: true,
  101 |     dike: false,
  102 |     retention: true,
  103 |     measureLevel: 75,
  104 |     cameraHeight: 2200
  105 |   },
  106 |   {
  107 |     name: 'harz-far-slow-standard',
  108 |     lon: 10.6,
  109 |     lat: 51.75,
  110 |     profile: 'standard',
  111 |     mode: 'rain',
```