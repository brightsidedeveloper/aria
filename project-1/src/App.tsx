import { useRef, useState } from 'react';

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const openModal = () => {
    setIsOpen(true);
    dialogRef.current?.showModal();
  };

  const closeModal = () => {
    setIsOpen(false);
    dialogRef.current?.close();
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <button 
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={openModal}
      >
        Open Modal
      </button>
      
      <dialog 
        ref={dialogRef} 
        onClick={(e) => {
          if (e.target === dialogRef.current) closeModal();
        }}
        className="p-4 bg-white rounded shadow-lg"
      >
        <div>
          <p>This is a modal dialog. Click outside to close.</p>
          <button onClick={closeModal} className="mt-2 bg-red-500 text-white px-4 py-2 rounded">Close</button>
        </div>
      </dialog>
    </div>
  );
}

export default App;
