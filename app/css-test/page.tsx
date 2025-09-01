import React from 'react'

export default function CSSTest() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          🎨 CSS Verification Test
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-lg shadow-lg p-6 transform hover:scale-105 transition-transform">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">✓</span>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-800">Tailwind Classes</h3>
            </div>
            <p className="text-gray-600">Background colors, text styling, spacing working</p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-lg shadow-lg p-6 transform hover:scale-105 transition-transform">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">✓</span>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-800">Responsive Grid</h3>
            </div>
            <p className="text-gray-600">Grid layouts, breakpoints, responsive design</p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-lg shadow-lg p-6 transform hover:scale-105 transition-transform">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">✓</span>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-800">Animations</h3>
            </div>
            <p className="text-gray-600">Hover effects, transforms, transitions</p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button className="bg-white text-yellow-600 px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-shadow">
            CSS is Working! ✨
          </button>
        </div>

        <div className="mt-8 bg-white/20 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Status Check:</h2>
          <ul className="space-y-2 text-white">
            <li className="flex items-center">
              <span className="text-green-300 mr-2">✅</span>
              Tailwind CSS v4 configured
            </li>
            <li className="flex items-center">
              <span className="text-green-300 mr-2">✅</span>
              PostCSS with @tailwindcss/postcss
            </li>
            <li className="flex items-center">
              <span className="text-green-300 mr-2">✅</span>
              Global styles loaded
            </li>
            <li className="flex items-center">
              <span className="text-green-300 mr-2">✅</span>
              CSS custom properties working
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
