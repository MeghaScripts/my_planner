# My Study Universe
Dream it. Learn it. Build it. Achieve it.

    npm install
    npm run dev        # http://localhost:5173
    npm run build

Schedule data: `src/data/schedule.base.json` is parsed from the PDF (`npm run parse`, needs poppler's pdftotext). `src/data/schedule.json` is that plan with your exam days turned into off days (`npm run holidays`). To change exam dates, edit `EXAMS` in `scripts/apply_holidays.py` and re-run it; later stages move by whole weeks so the weekday rhythm (rest Sundays, Tue applications, Thu networking) stays intact. Data is stored in your browser's IndexedDB; use Settings → Export to back up.
