export default function Outro() {
  return (
    <div className='flex flex-col items-center justify-center h-screen bg-slate-900'>
      <h1 className='text-7xl fade-in font-bold text-violet-500 shadow-inner'>I am Aria</h1>
      <svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'>
        <path d='M30 2L2 34h30L20 62 62 26H34l16-24z' />
      </svg>
      <div className='mt-8 fade-in text-xl text-white'>Your personal developer assistant!</div>
    </div>
  )
}
