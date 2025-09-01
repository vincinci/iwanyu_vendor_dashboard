// Using built-in fetch for Node.js 18+

const testUrl = 'http://localhost:3001/vendor';

console.log('🎨 CSS Application Test');
console.log('======================');

try {
    console.log(`📄 Fetching page: ${testUrl}`);
    const response = await fetch(testUrl);
    const html = await response.text();
    
    // Check if CSS classes are present in the HTML
    const hasBasicClasses = html.includes('bg-') || html.includes('text-') || html.includes('p-') || html.includes('m-');
    const hasFlexClasses = html.includes('flex') || html.includes('grid');
    const hasColorClasses = html.includes('bg-background') || html.includes('text-foreground');
    const hasStyleTag = html.includes('<style') || html.includes('stylesheet');
    
    console.log('\n📋 CSS Analysis:');
    console.log(`✅ Basic Tailwind classes: ${hasBasicClasses ? 'Found' : 'Missing'}`);
    console.log(`✅ Layout classes: ${hasFlexClasses ? 'Found' : 'Missing'}`);
    console.log(`✅ CSS variables: ${hasColorClasses ? 'Found' : 'Missing'}`);
    console.log(`✅ Style tags: ${hasStyleTag ? 'Found' : 'Missing'}`);
    
    // Check for specific vendor dashboard elements
    const hasVendorContent = html.includes('Vendor') || html.includes('vendor');
    const hasSidebar = html.includes('sidebar') || html.includes('nav');
    
    console.log('\n🏪 Vendor Dashboard Content:');
    console.log(`✅ Vendor content: ${hasVendorContent ? 'Found' : 'Missing'}`);
    console.log(`✅ Navigation elements: ${hasSidebar ? 'Found' : 'Missing'}`);
    
    // Check for mobile responsiveness classes
    const hasMobileClasses = html.includes('sm:') || html.includes('md:') || html.includes('lg:');
    console.log(`✅ Responsive classes: ${hasMobileClasses ? 'Found' : 'Missing'}`);
    
    if (hasBasicClasses && hasFlexClasses && hasStyleTag) {
        console.log('\n🎉 CSS Status: WORKING');
        console.log('✅ Tailwind CSS is properly applied!');
    } else {
        console.log('\n⚠️  CSS Status: ISSUES DETECTED');
        console.log('❌ Tailwind CSS may not be loading correctly');
        
        // Extract first 500 chars of body for debugging
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
        if (bodyMatch) {
            const bodyContent = bodyMatch[1].substring(0, 500);
            console.log('\n🔍 HTML Body Preview:');
            console.log(bodyContent + '...');
        }
    }
    
} catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log('💡 Make sure the dev server is running on http://localhost:3001');
}
