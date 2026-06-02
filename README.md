# Vereins-Schutzbrief Konfigurator

Ein interaktiver, mehrstufiger Online-Konfigurator zur Berechnung von maßgeschneiderten Versicherungspaketen (Vereins-Schutzbrief) für Vereine, Stiftungen und gemeinnützige GmbHs.

## 🚀 Live-Demo
Du kannst dir den fertigen Konfigurator hier live ansehen:
👉 [DEIN-GITHUB-BENUTZERNAME.github.io/DEIN-REPOSITORY-NAME](https://DEIN-GITHUB-BENUTZERNAME.github.io/DEIN-REPOSITORY-NAME)
*(Hinweis: Ersetze den Link mit deiner GitHub-Pages-URL)*

---

## ✨ Funktionen
* **Mehrstufiger Prozess (Stepper):** Schritt-für-Schritt-Abfrage von Rechtsform, Budget, Mitgliederzahl und Sparte.
* **Dynamische Preisberechnung:** Automatische Ermittlung des Beitrags basierend auf den Benutzerangaben.
* **Inklusivleistungen vs. Optionale Bausteine:** Flexibles Hinzufügen von Zusatzversicherungen (D&O, Rechtsschutz, Rückwirkende Absicherung).
* **Flexible Startzeitpunkte:** Logik zur Verschiebung oder zum Aussetzen einzelner Pflichtbausteine mit anteiliger Preisberechnung im ersten Jahr.
* **Zusammenfassung & Kostenübersicht:** Transparente Dreifach-Kostenaufteilung im finalen Schritt.
* **Hilfe-Modals:** Kontextsensitive Erklärungen zu allen Fachbegriffen via Klick-Delegation.
* **Responsive Design:** Optimierte Darstellung für Smartphones und Tablets (mobiler, fixierter Stepper).

---

## 🛠️ Tech-Stack
* **HTML5:** Strukturierung des Konfigurators und der Modals.
* **CSS3:** Modernes Custom-Styling (Shadcn-Style Checkboxen, fluid/proportionale Typografie via CSS Variables).
* **Vanilla JavaScript:** Gesamte Anwendungslogik, State-Management und Event-Handling (ohne externe Frameworks).

---

## 📂 Projektstruktur
Das Projekt ist sauber in drei separate Kernkomponenten aufgeteilt:

* `index.html` - Enthält das HTML-Grundgerüst und die Modals.
* `style.css` - Das komplette Design-System und die responsiven Breakpoints.
* `script.js` - Das State-Management, die Preistabellen und die Render-Logik.

---

## 💻 Lokale Entwicklung
Um das Projekt auf deinem Computer auszuführen, musst du keine Pakete installieren:
1. Klone das Repository oder lade die Dateien herunter.
2. Öffne die `index.html` einfach per Doppelklick in einem beliebigen Browser.
