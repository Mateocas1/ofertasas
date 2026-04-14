# Testing Guide

This guide provides instructions for manual smoke testing and development setup.

## Manual Smoke Test Checklist

Follow this checklist to verify the application is working correctly in production:

### 1. API Health Check
- [ ] Visit `/health` endpoint on the API - should return 200 OK
- [ ] Check that all 3 supermarket services are accessible
- [ ] Verify Redis connection is working
- [ ] Confirm database connectivity

### 2. Search Functionality
- [ ] Enter a search term (e.g., "leche") in the search bar
- [ ] Verify results are returned from at least 2 supermarkets
- [ ] Check that product names, brands, and images are displayed correctly
- [ ] Confirm that prices from different supermarkets are shown
- [ ] Verify that the cheapest price is highlighted

### 3. Product Detail Page
- [ ] Click on a product from the search results
- [ ] Verify the product detail page loads correctly
- [ ] Check that all 3 supermarket prices are displayed
- [ ] Confirm that price history chart is visible and shows data
- [ ] Verify that promotions are displayed correctly

### 4. Cart Functionality
- [ ] Add a product to the cart from the search results
- [ ] Open the cart drawer and verify the item is added
- [ ] Try to increase/decrease quantity of the item
- [ ] Try to remove an item from the cart
- [ ] Verify that the cart total is calculated correctly

### 5. Cart Persistence
- [ ] Add items to the cart
- [ ] Reload the page
- [ ] Verify that the cart items persist after reload
- [ ] Check that the cart is associated with the same session

### 6. Console and Network Checks
- [ ] Open browser developer tools
- [ ] Check the console for any JavaScript errors
- [ ] Check the network tab for any failed API requests
- [ ] Verify that all images load correctly

## Development Setup Instructions

### 1. Initial Setup
```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your local database and Redis URLs
```

### 2. Database Setup
```bash
# Create database schema
pnpm db:push

# Seed initial data (supermarkets)
pnpm db:seed
```

### 3. Run Development Servers
```bash
# Start both API and web servers
pnpm dev
```

This will start:
- API server on http://localhost:3001
- Web frontend on http://localhost:3000

### 4. Running Tests
```bash
# Run unit tests (if available)
pnpm test

# Run end-to-end tests (if available)
pnpm test:e2e
```

## Common Issues and Solutions

### API Not Responding
1. Check that the API server is running
2. Verify DATABASE_URL and REDIS_URL environment variables
3. Ensure the database is accessible
4. Check for any error messages in the console

### Search Returns No Results
1. Verify that the VTEX API endpoints are accessible
2. Check that the hash discovery worker has run successfully
3. Ensure the VTEX hashes are correctly stored in Redis/DB

### Cart Not Persisting
1. Check that the session ID is being passed correctly
2. Verify that the database connection is working
3. Ensure the cart API endpoints are accessible

### Performance Issues
1. Check that Redis caching is working correctly
2. Verify that database indexes are created
3. Check for any slow database queries in the logs

## Additional Testing Scenarios

### Mobile Responsiveness
- [ ] Test all pages on mobile screen sizes
- [ ] Verify that the cart drawer works on mobile
- [ ] Check that touch targets are appropriately sized

### Cross-Browser Compatibility
- [ ] Test on Chrome, Firefox, Safari, and Edge
- [ ] Verify that all features work consistently across browsers

### Accessibility Testing
- [ ] Test with screen readers
- [ ] Verify keyboard navigation
- [ ] Check color contrast ratios

### Security Testing
- [ ] Verify that API endpoints are properly protected
- [ ] Check for any potential XSS or injection vulnerabilities
- [ ] Ensure that sensitive data is not exposed in logs