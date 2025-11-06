import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'


function App() {
    const [count, setCount] = useState(0)

    return (
        <div className="min-h-screen bg-gray-100 py-8"> {/* ← добавил Tailwind классы */}
            <div className="text-center">
                <div className="flex justify-center gap-8 mb-8">
                    <a href="https://vite.dev" target="_blank">
                        <img src={viteLogo} className="logo h-24" alt="Vite logo" />
                    </a>
                    <a href="https://react.dev" target="_blank">
                        <img src={reactLogo} className="logo react h-24" alt="React logo" />
                    </a>
                </div>
                <h1 className="text-4xl font-bold mb-8">Vite + React</h1>
                <div className="card">
                    <button
                        className="w-60 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                        onClick={() => setCount((count) => count + 1)}
                    >
                        count is {count}
                    </button>
                    <p className="mt-4 text-gray-600">
                        Edit <code className="bg-gray-200 px-1 rounded">src/App.tsx</code> and save to test HMR
                    </p>
                </div>
                <p className="read-the-docs text-gray-500 mt-8">
                    Click on the Vite and React logos to learn more
                </p>
            </div>
        </div>
    )
}

export default App