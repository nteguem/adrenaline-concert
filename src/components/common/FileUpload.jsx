"use client";
import React, { useRef, useState } from 'react';
import { Download, Check, X, FileText, Image as ImageIcon } from 'lucide-react';

const FileUpload = ({ onFileSelect, label = "IMPORTEZ VOTRE BILLET" }) => {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('');

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      setFileType(file.type);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target.result);
        onFileSelect(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearFile = (e) => {
    e.stopPropagation();
    setPreview(null);
    setFileName('');
    setFileType('');
    fileInputRef.current.value = '';
    onFileSelect(null);
  };

  const renderPreviewContent = () => {
    if (fileType.startsWith('image/')) {
      return (
        <img 
          src={preview} 
          alt="Aperçu" 
          className="w-full h-full object-cover"
        />
      );
    } else if (fileType === 'application/pdf') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-blue-50">
          <FileText className="h-10 w-10 text-blue-500" />
        </div>
      );
    } else {
      return (
        <div className="w-full h-full flex items-center justify-center bg-blue-50">
          <FileText className="h-10 w-10 text-blue-500" />
        </div>
      );
    }
  };

  const getFileIcon = () => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4 mr-1" />;
    } else if (fileType === 'application/pdf') {
      return <FileText className="h-4 w-4 mr-1" />;
    } else {
      return <FileText className="h-4 w-4 mr-1" />;
    }
  };

  return (
    <div className="w-full">
      {!preview ? (
        // Bouton d'importation lorsqu'aucun fichier n'est sélectionné
        <button
          type="button"
          onClick={handleButtonClick}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded w-full flex items-center justify-between"
        >
          <span>{label}</span>
          <Download className="h-5 w-5" />
        </button>
      ) : (
        // Aperçu du fichier après sélection
        <div 
          className="w-full rounded overflow-hidden border-2 border-blue-500 bg-blue-100 cursor-pointer"
          onClick={handleButtonClick}
        >
          <div className="relative">
            {/* Aperçu du fichier */}
            <div className="flex items-center p-2">
              <div className="w-16 h-16 mr-4 bg-white rounded overflow-hidden flex-shrink-0">
                {renderPreviewContent()}
              </div>
              
              <div className="flex-grow">
                <p className="font-medium text-blue-800 truncate">{fileName}</p>
                <p className="text-sm text-blue-600 flex items-center">
                  {getFileIcon()}
                  Billet importé
                </p>
              </div>
              
              <button
                onClick={clearFile}
                className="p-1 rounded-full bg-blue-500 text-white hover:bg-blue-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,application/pdf"
        className="hidden"
      />
    </div>
  );
};

export default FileUpload;