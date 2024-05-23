import React, { useState, useRef } from 'react';

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const modalRef = useRef<HTMLDialogElement>(null);

  const openModal = () => {
    setIsModalOpen(true);
    modalRef.current?.showModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    modalRef.current?.close();
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === modalRef.current) {
      closeModal();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <button 
        className="bg-blue-500 text-white px-4 py-2 rounded" 
        onClick={openModal}
      >
        OpenModal
      </button>
      <dialog ref={modalRef} className="p-6 bg-white rounded shadow-md w-96" onClick={handleBackdropClick}>
        <form method="dialog" className="flex flex-col space-y-4">
          <label>
            First Name:
            <input type="text" name="firstName" className="border p-2 w-full" required />
          </label>
          <label>
            Last Name:
            <input type="text" name="lastName" className="border p-2 w-full" required />
          </label>
          <label>
            Email:
            <input type="email" name="email" className="border p-2 w-full" required />
          </label>
          <label>
            Password:
            <input type="password" name="password" className="border p-2 w-full" required />
          </label>
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
            Submit
          </button>
          <button 
            type="button" 
            className="bg-gray-500 text-white px-4 py-2 rounded" 
            onClick={closeModal}
          >
            Close
          </button>
        </form>
      </dialog>
    </div>
  );
}
