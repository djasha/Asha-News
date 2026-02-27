#!/bin/bash

# Setup cron job for automatic news refresh
# This script sets up a cron job to run the news refresh every hour

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REFRESH_SCRIPT="$SCRIPT_DIR/refreshNews.js"
LOG_FILE="$SCRIPT_DIR/../logs/refresh.log"

# Create logs directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "refreshNews.js"; then
    echo "✓ Cron job already exists for news refresh"
    crontab -l | grep refreshNews
else
    echo "Setting up hourly news refresh cron job..."
    
    # Add cron job (runs every hour at minute 0)
    (crontab -l 2>/dev/null; echo "0 * * * * /usr/local/bin/node $REFRESH_SCRIPT >> $LOG_FILE 2>&1") | crontab -
    
    echo "✅ Cron job added successfully!"
    echo "News will refresh automatically every hour"
    echo "Logs will be saved to: $LOG_FILE"
fi

echo ""
echo "To view current cron jobs: crontab -l"
echo "To remove the cron job: crontab -l | grep -v refreshNews | crontab -"
echo "To manually run refresh: node $REFRESH_SCRIPT"
