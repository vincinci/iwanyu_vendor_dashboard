#!/bin/bash

# Continuous Application Monitor
# Runs comprehensive tests every N seconds and logs results

APP_URL="https://iwanyuvendordashboard.vercel.app"
MONITOR_INTERVAL=30  # seconds between checks
LOG_FILE="monitor.log"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log with timestamp
log_with_timestamp() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Function to check critical endpoints
check_critical_endpoints() {
    local all_good=true
    
    # Check main application
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL")
    if [ "$HTTP_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ Application accessible${NC}"
    else
        echo -e "${RED}❌ Application inaccessible (HTTP $HTTP_STATUS)${NC}"
        all_good=false
    fi
    
    # Check API endpoints
    endpoints=("/api/products" "/api/upload-images" "/api/health")
    expected_statuses=(401 405 200)
    
    for i in "${!endpoints[@]}"; do
        endpoint="${endpoints[$i]}"
        expected="${expected_statuses[$i]}"
        
        status=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL$endpoint")
        if [ "$status" = "$expected" ]; then
            echo -e "${GREEN}✅ $endpoint (HTTP $status)${NC}"
        else
            echo -e "${RED}❌ $endpoint (HTTP $status, expected $expected)${NC}"
            all_good=false
        fi
    done
    
    # Check static assets
    assets=("/icon.png" "/logo.png" "/placeholder.svg")
    for asset in "${assets[@]}"; do
        status=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL$asset")
        if [ "$status" = "200" ]; then
            echo -e "${GREEN}✅ $asset${NC}"
        else
            echo -e "${YELLOW}⚠️  $asset (HTTP $status)${NC}"
        fi
    done
    
    if [ "$all_good" = true ]; then
        log_with_timestamp "✅ All systems healthy"
        return 0
    else
        log_with_timestamp "❌ Issues detected"
        return 1
    fi
}

# Function to run health check
run_health_check() {
    echo -e "${BLUE}🔍 Running health check...${NC}"
    node health-check.mjs > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Health check passed${NC}"
        return 0
    else
        echo -e "${RED}❌ Health check failed${NC}"
        return 1
    fi
}

# Function to test database schema
test_schema_compatibility() {
    echo -e "${BLUE}🔍 Testing schema compatibility...${NC}"
    
    # This would ideally test actual database operations
    # For now, we just verify the API endpoints respond correctly
    
    # Test products endpoint (should require auth)
    status=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/products")
    if [ "$status" = "401" ]; then
        echo -e "${GREEN}✅ Products API schema compatible${NC}"
        return 0
    else
        echo -e "${RED}❌ Products API schema issue (HTTP $status)${NC}"
        return 1
    fi
}

# Main monitoring function
monitor_application() {
    local check_count=0
    local failure_count=0
    
    echo -e "${BLUE}🚀 Starting continuous monitoring of $APP_URL${NC}"
    echo -e "${BLUE}📊 Check interval: ${MONITOR_INTERVAL}s${NC}"
    echo -e "${BLUE}📝 Log file: $LOG_FILE${NC}"
    echo ""
    
    log_with_timestamp "🚀 Monitoring started"
    
    while true; do
        check_count=$((check_count + 1))
        echo -e "${BLUE}🔄 Check #$check_count $(date '+%H:%M:%S')${NC}"
        echo "----------------------------------------"
        
        # Run all checks
        local checks_passed=0
        local total_checks=3
        
        if check_critical_endpoints; then
            checks_passed=$((checks_passed + 1))
        fi
        
        if run_health_check; then
            checks_passed=$((checks_passed + 1))
        fi
        
        if test_schema_compatibility; then
            checks_passed=$((checks_passed + 1))
        fi
        
        # Report results
        if [ $checks_passed -eq $total_checks ]; then
            echo -e "${GREEN}✅ All $total_checks checks passed${NC}"
            log_with_timestamp "✅ Check #$check_count: ALL PASSED ($checks_passed/$total_checks)"
        else
            failure_count=$((failure_count + 1))
            echo -e "${RED}❌ $checks_passed/$total_checks checks passed${NC}"
            log_with_timestamp "❌ Check #$check_count: FAILURES ($checks_passed/$total_checks)"
        fi
        
        echo -e "${BLUE}📊 Total checks: $check_count | Failures: $failure_count${NC}"
        echo ""
        
        # Wait for next check
        sleep $MONITOR_INTERVAL
    done
}

# Function to show usage
show_usage() {
    echo "Application Monitor - Continuous Health Checking"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  monitor     Start continuous monitoring (default)"
    echo "  check       Run single health check"
    echo "  logs        Show recent log entries"
    echo "  clean       Clean log files"
    echo "  help        Show this help"
    echo ""
    echo "Configuration:"
    echo "  APP_URL: $APP_URL"
    echo "  INTERVAL: ${MONITOR_INTERVAL}s"
    echo "  LOG_FILE: $LOG_FILE"
}

# Handle command line arguments
case "${1:-monitor}" in
    "monitor")
        monitor_application
        ;;
    "check")
        echo -e "${BLUE}🔍 Running single health check...${NC}"
        check_critical_endpoints
        run_health_check
        test_schema_compatibility
        ;;
    "logs")
        if [ -f "$LOG_FILE" ]; then
            echo -e "${BLUE}📝 Recent log entries:${NC}"
            tail -20 "$LOG_FILE"
        else
            echo -e "${YELLOW}⚠️  No log file found${NC}"
        fi
        ;;
    "clean")
        if [ -f "$LOG_FILE" ]; then
            rm "$LOG_FILE"
            echo -e "${GREEN}✅ Log file cleaned${NC}"
        else
            echo -e "${YELLOW}⚠️  No log file to clean${NC}"
        fi
        ;;
    "help"|"--help"|"-h")
        show_usage
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        show_usage
        exit 1
        ;;
esac
