BM04 V8 patch from V7
1) Backup source + database.
2) Copy patch files over V7 source.
3) Run dev\upgrade_v7_to_v8.bat once to update portal_worktype business catalog.
4) Restart backend/frontend and hard-refresh browser.
No Django schema migration is required for V8.
