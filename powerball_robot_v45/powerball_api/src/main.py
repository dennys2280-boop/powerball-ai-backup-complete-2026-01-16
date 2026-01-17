

app.include_router(telemetry_router)
app.include_router(jobs_router)
app.include_router(backtest_router)
app.include_router(share_router)

app.include_router(optimize_router)
app.include_router(export_router)
