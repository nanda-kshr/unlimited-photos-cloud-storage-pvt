'use client';

import React, { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, ChevronRight, ChevronDown, ExternalLink } from 'lucide-react';

interface TabProps {
  id: string;
  label: string;
  language: string;
  code: string;
}

interface EndpointProps {
  id: string;
  title: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  requestParams?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  requestBody?: string;
  responseBody: string;
  tabs: TabProps[];
}

const MethodBadge: React.FC<{ method: string }> = ({ method }) => {
  const getColor = () => {
    switch (method) {
      case 'GET': return 'bg-blue-500';
      case 'POST': return 'bg-green-500';
      case 'PUT': return 'bg-yellow-500';
      case 'DELETE': return 'bg-red-500';
      case 'PATCH': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <span className={`${getColor()} text-white px-3 py-1 rounded-md font-mono font-semibold text-sm`}>
      {method}
    </span>
  );
};

const TabsComponent: React.FC<{ tabs: TabProps[] }> = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id);
  const [copied, setCopied] = useState<string | null>(null);
  
  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="mt-4 border border-gray-700 rounded-lg overflow-hidden">
      <div className="flex border-b border-gray-700 bg-gray-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`px-4 py-2 font-medium text-sm focus:outline-none ${
              activeTab === tab.id 
              ? 'text-white border-b-2 border-blue-500' 
              : 'text-gray-400 hover:text-gray-200'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="relative">
        {tabs.map(tab => (
          <div 
            key={tab.id} 
            className={`${activeTab === tab.id ? 'block' : 'hidden'}`}
          >
            <SyntaxHighlighter 
              language={tab.language} 
              style={vscDarkPlus}
              customStyle={{ margin: 0, borderRadius: 0, padding: '1.5rem' }}
              showLineNumbers
            >
              {tab.code}
            </SyntaxHighlighter>
            <button
              onClick={() => handleCopy(tab.code, tab.id)}
              className="absolute top-4 right-4 p-2 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300"
              aria-label="Copy code"
            >
              {copied === tab.id ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const Endpoint: React.FC<EndpointProps> = ({ 
  id, title, method, path, description, requestParams, requestBody, responseBody, tabs 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="mb-10 border border-gray-700 rounded-lg overflow-hidden">
      <div 
        className="flex items-center justify-between p-4 bg-gray-800 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-3">
          <MethodBadge method={method} />
          <h3 className="text-xl font-medium text-white">{title}</h3>
        </div>
        <div className="flex items-center space-x-4">
          <code className="px-2 py-1 bg-gray-700 rounded-md text-gray-300 font-mono text-sm">
            {path}
          </code>
          {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
      </div>
      
      {isOpen && (
        <div className="p-6 bg-gray-900">
          <p className="text-gray-300 mb-6">{description}</p>
          
          {requestParams && requestParams.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-medium text-white mb-3">Request Parameters</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Parameter</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Required</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {requestParams.map((param, index) => (
                      <tr key={index} className="bg-gray-800">
                        <td className="px-4 py-3 text-sm font-mono text-blue-400">{param.name}</td>
                        <td className="px-4 py-3 text-sm font-mono text-green-400">{param.type}</td>
                        <td className="px-4 py-3 text-sm">
                          {param.required ? 
                            <span className="px-2 py-1 bg-red-900/30 text-red-400 rounded-md text-xs">Required</span> :
                            <span className="px-2 py-1 bg-gray-700 text-gray-400 rounded-md text-xs">Optional</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">{param.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {requestBody && (
            <div className="mb-6">
              <h4 className="text-lg font-medium text-white mb-3">Request Body</h4>
              <SyntaxHighlighter 
                language="json" 
                style={vscDarkPlus}
                customStyle={{ borderRadius: '8px' }}
              >
                {requestBody}
              </SyntaxHighlighter>
            </div>
          )}
          
          <div className="mb-6">
            <h4 className="text-lg font-medium text-white mb-3">Response</h4>
            <SyntaxHighlighter 
              language="json" 
              style={vscDarkPlus}
              customStyle={{ borderRadius: '8px' }}
            >
              {responseBody}
            </SyntaxHighlighter>
          </div>
          
          <div>
            <h4 className="text-lg font-medium text-white mb-3">Examples</h4>
            <TabsComponent tabs={tabs} />
          </div>
        </div>
      )}
    </div>
  );
};

const APIDocumentationPage: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<string>('introduction');
  const [visibleTOC, setVisibleTOC] = useState<boolean>(false);
  
  // Track scroll position to update active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section[id]');
      let currentActiveSection = 'introduction';
      
      sections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        if (sectionTop <= 100) {
          currentActiveSection = section.id;
        }
      });
      
      setCurrentSection(currentActiveSection);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      window.scrollTo({
        top: section.offsetTop - 80,
        behavior: 'smooth'
      });
      setCurrentSection(sectionId);
      
      // Close TOC on mobile after clicking
      if (window.innerWidth < 768) {
        setVisibleTOC(false);
      }
    }
  };
  
  const uploadFileEndpoint: EndpointProps = {
    id: 'upload-files',
    title: 'Upload Files',
    method: 'POST',
    path: '/api/v1/files/upload',
    description: 'Upload files to Telegram and store metadata in MongoDB. This endpoint supports multiple file uploads and can optionally create compressed versions of the images.',
    requestParams: [
      { name: 'image', type: 'File[]', required: true, description: 'One or more image files to upload. Supported formats: JPEG, PNG, WebP, GIF' },
      { name: 'chatId', type: 'String', required: true, description: 'Telegram chat ID where files will be uploaded' },
      { name: 'key', type: 'String', required: true, description: 'Telegram bot API key' },
      { name: 'mongouri', type: 'String', required: true, description: 'MongoDB connection URI' },
      { name: 'collection', type: 'String', required: false, description: 'MongoDB collection name (defaults to config value)' },
      { name: 'compress', type: 'Boolean', required: false, description: 'If set to \'true\', creates compressed versions of images' },
    ],
    responseBody: `{
  "message": "Upload successful",
  "fileIds": [
    {
      "fileId": "AAQCABNmbjFjGAQAAgI-CvmMRVoZAAIC",
      "placeholderId": "AgACAgQAAxkBAAICPgr5jEVaGQACAnmEwb7rPXBIoDFpAAL4ujEbZm4xY_JvEGgpozt-AQADAgADeAADLwQ"
    },
    {
      "fileId": "AAQCABNmbjFjGAQBAgI-CcwN4RghAAIC",
      "placeholderId": "AgACAgQAAxkBAAICPgr5jEVaGQACAnmEwb7rPXBIoDFpAAL4ujEbZm4xY_JvEGgpozt-AQADAgADeAADLwQ"
    }
  ]
}`,
    tabs: [
      {
        id: 'curl-upload',
        label: 'cURL',
        language: 'bash',
        code: `curl -X POST https://your-domain/api/v1/files/upload \\
  -F "image=@image1.jpg" \\
  -F "image=@image2.png" \\
  -F "chatId=123456789" \\
  -F "key=your_telegram_bot_api_key" \\
  -F "mongouri=mongodb://username:password@host:port/database" \\
  -F "collection=images" \\
  -F "compress=true"`
      },
      {
        id: 'python-upload',
        label: 'Python',
        language: 'python',
        code: `import requests

url = "https://your-domain/api/v1/files/upload"

# Open files
files = [
    ('image', ('image1.jpg', open('path/to/image1.jpg', 'rb'), 'image/jpeg')),
    ('image', ('image2.png', open('path/to/image2.png', 'rb'), 'image/png'))
]

data = {
    'chatId': '123456789',
    'key': 'your_telegram_bot_api_key',
    'mongouri': 'mongodb://username:password@host:port/database',
    'collection': 'images',
    'compress': 'true'
}

response = requests.post(url, files=files, data=data)
print(response.json())`
      },
      {
        id: 'nodejs-upload',
        label: 'Node.js',
        language: 'javascript',
        code: `const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function uploadFiles() {
  const formData = new FormData();
  
  // Add files
  formData.append('image', fs.createReadStream(path.join(__dirname, 'image1.jpg')));
  formData.append('image', fs.createReadStream(path.join(__dirname, 'image2.png')));
  
  // Add other fields
  formData.append('chatId', '123456789');
  formData.append('key', 'your_telegram_bot_api_key');
  formData.append('mongouri', 'mongodb://username:password@host:port/database');
  formData.append('collection', 'images');
  formData.append('compress', 'true');
  
  try {
    const response = await axios.post(
      'https://your-domain/api/v1/files/upload',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );
    
    console.log(response.data);
  } catch (error) {
    console.error('Error uploading files:', error.response?.data || error.message);
  }
}

uploadFiles();`
      }
    ]
  };
  
  const retrieveFileEndpoint: EndpointProps = {
    id: 'retrieve-file-urls',
    title: 'Retrieve File URLs',
    method: 'POST',
    path: '/api/v1/files',
    description: 'Retrieves the URL for a file stored on Telegram, along with its placeholder image URL (if available).',
    requestBody: `{
  "fileId": "AAQCABNmbjFjGAQAAgI-CvmMRVoZAAIC",
  "apiKey": "your_telegram_bot_api_key",
  "mongoUri": "mongodb://username:password@host:port/database",
  "placeholderFileId": "AgACAgQAAxkBAAICPgr5jEVaGQACAnmEwb7rPXBIoDFpAAL4ujEbZm4xY_JvEGgpozt-AQADAgADeAADLwQ",
  "userId": "user123",  // Optional, required if placeholderFileId not provided
  "chatId": "123456789" // Optional, required if placeholderFileId not provided
}`,
    responseBody: `{
  "file": {
    "fileId": "AAQCABNmbjFjGAQAAgI-CvmMRVoZAAIC",
    "fileUrl": "https://api.telegram.org/file/bot<api_key>/documents/file_123.jpg",
    "placeholderFileId": "AgACAgQAAxkBAAICPgr5jEVaGQACAnmEwb7rPXBIoDFpAAL4ujEbZm4xY_JvEGgpozt-AQADAgADeAADLwQ",
    "placeholderFileUrl": "https://api.telegram.org/file/bot<api_key>/photos/file_123_thumb.jpg"
  },
  "success": true,
  "message": "SUCCESS"
}`,
    tabs: [
      {
        id: 'curl-retrieve',
        label: 'cURL',
        language: 'bash',
        code: `curl -X POST https://your-domain/api/v1/files \\
  -H "Content-Type: application/json" \\
  -d '{
    "fileId": "AAQCABNmbjFjGAQAAgI-CvmMRVoZAAIC",
    "apiKey": "your_telegram_bot_api_key",
    "mongoUri": "mongodb://username:password@host:port/database",
    "placeholderFileId": "AgACAgQAAxkBAAICPgr5jEVaGQACAnmEwb7rPXBIoDFpAAL4ujEbZm4xY_JvEGgpozt-AQADAgADeAADLwQ"
  }'`
      },
      {
        id: 'python-retrieve',
        label: 'Python',
        language: 'python',
        code: `import requests
import json

url = "https://your-domain/api/v1/files"

payload = {
    "fileId": "AAQCABNmbjFjGAQAAgI-CvmMRVoZAAIC",
    "apiKey": "your_telegram_bot_api_key",
    "mongoUri": "mongodb://username:password@host:port/database",
    "placeholderFileId": "AgACAgQAAxkBAAICPgr5jEVaGQACAnmEwb7rPXBIoDFpAAL4ujEbZm4xY_JvEGgpozt-AQADAgADeAADLwQ"
}

headers = {
    "Content-Type": "application/json"
}

response = requests.post(url, data=json.dumps(payload), headers=headers)
print(response.json())`
      },
      {
        id: 'nodejs-retrieve',
        label: 'Node.js',
        language: 'javascript',
        code: `const axios = require('axios');

async function retrieveFileUrl() {
  const url = 'https://your-domain/api/v1/files';
  
  const payload = {
    fileId: 'AAQCABNmbjFjGAQAAgI-CvmMRVoZAAIC',
    apiKey: 'your_telegram_bot_api_key',
    mongoUri: 'mongodb://username:password@host:port/database',
    placeholderFileId: 'AgACAgQAAxkBAAICPgr5jEVaGQACAnmEwb7rPXBIoDFpAAL4ujEbZm4xY_JvEGgpozt-AQADAgADeAADLwQ'
  };
  
  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(response.data);
  } catch (error) {
    console.error('Error retrieving file URL:', error.response?.data || error.message);
  }
}

retrieveFileUrl();`
      }
    ]
  };
  
  const retrieveGalleryEndpoint: EndpointProps = {
    id: 'retrieve-gallery',
    title: 'Retrieve Gallery',
    method: 'POST',
    path: '/api/v1/inweb/gallery',
    description: 'Retrieves the gallery of images for a specific user and optionally for a specific chat. The response includes URLs for both original files and their compressed placeholders (if available).',
    requestBody: `{
  "apiKey": "your_telegram_bot_api_key",
  "userId": "user123",
  "chatId": "123456789",  // Optional - if not provided, returns all chats for this user
  "mongouri": "mongodb://username:password@host:port/database",
  "collectionName": "images"
}`,
    responseBody: `{
  "userId": "user123",
  "galleryData": {
    "123456789": [
      {
        "messageId": 123,
        "timestamp": "2023-04-12T10:43:51Z",
        "caption": "Amazing sunset",
        "fileUrl": "https://api.telegram.org/file/bot<api_key>/documents/file_123.jpg",
        "uploadedAt": "2023-04-12T10:43:51Z",
        "placeholderFileId": "AgACAgQAAxkBAAICPgr5jEVaGQACAnmEwb7rPXBIoDFpAAL4ujEbZm4xY_JvEGgpozt-AQADAgADeAADLwQ",
        "placeholderFileUrl": "https://api.telegram.org/file/bot<api_key>/photos/file_123_thumb.jpg"
      },
      {
        "messageId": 124,
        "timestamp": "2023-04-12T10:45:22Z",
        "caption": "",
        "fileUrl": "https://api.telegram.org/file/bot<api_key>/documents/file_124.jpg",
        "uploadedAt": "2023-04-12T10:45:22Z",
        "placeholderFileId": "AgACAgQAAxkBAAICPgr5jEVaGQACAnmEwb7rPXBIoDFpAAL4ujEbZm4xY_JvEGgpozt-AQADAgADeAADLwQ",
        "placeholderFileUrl": "https://api.telegram.org/file/bot<api_key>/photos/file_124_thumb.jpg"
      }
    ]
  },
  "totalChats": 1,
  "totalImages": 2
}`,
    tabs: [
      {
        id: 'curl-gallery',
        label: 'cURL',
        language: 'bash',
        code: `curl -X POST https://your-domain/api/v1/inweb/gallery \\
  -H "Content-Type: application/json" \\
  -d '{
    "apiKey": "your_telegram_bot_api_key",
    "userId": "user123",
    "chatId": "123456789",
    "mongouri": "mongodb://username:password@host:port/database",
    "collectionName": "images"
  }'`
      },
      {
        id: 'python-gallery',
        label: 'Python',
        language: 'python',
        code: `import requests
import json

url = "https://your-domain/api/v1/inweb/gallery"

payload = {
    "apiKey": "your_telegram_bot_api_key",
    "userId": "user123",
    "chatId": "123456789",
    "mongouri": "mongodb://username:password@host:port/database",
    "collectionName": "images"
}

headers = {
    "Content-Type": "application/json"
}

response = requests.post(url, data=json.dumps(payload), headers=headers)
print(response.json())`
      },
      {
        id: 'nodejs-gallery',
        label: 'Node.js',
        language: 'javascript',
        code: `const axios = require('axios');

async function retrieveGallery() {
  const url = 'https://your-domain/api/v1/inweb/gallery';
  
  const payload = {
    apiKey: 'your_telegram_bot_api_key',
    userId: 'user123',
    chatId: '123456789', // Optional - remove to get all chats
    mongouri: 'mongodb://username:password@host:port/database',
    collectionName: 'images'
  };
  
  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(\`Total images: \${response.data.totalImages}\`);
    console.log(\`Gallery data: \`, response.data.galleryData);
  } catch (error) {
    console.error('Error retrieving gallery:', error.response?.data || error.message);
  }
}

retrieveGallery();`
      }
    ]
  };
  
  const webUploadEndpoint: EndpointProps = {
    id: 'web-upload',
    title: 'Web Upload Interface',
    method: 'POST',
    path: '/api/v1/inweb/upload',
    description: 'Upload files to Telegram through a web interface and store metadata in MongoDB. This endpoint is designed for web applications and supports multiple file uploads.',
    requestParams: [
      { name: 'image', type: 'File[]', required: true, description: 'One or more image files to upload' },
      { name: 'chatId', type: 'String', required: true, description: 'Telegram chat ID where files will be uploaded' },
      { name: 'key', type: 'String', required: true, description: 'User ID or API key' },
      { name: 'mongouri', type: 'String', required: false, description: 'MongoDB connection URI (defaults to environment variable)' },
      { name: 'collection', type: 'String', required: false, description: 'MongoDB collection name (defaults to environment variable)' },
      { name: 'compress', type: 'Boolean', required: false, description: 'If set to \'true\', creates compressed versions of images' },
    ],
    responseBody: `{
  "message": "Upload successful",
  "imageInfo": [
    {
      "messageId": 123,
      "chatId": "123456789",
      "timestamp": "2023-04-12T10:43:51Z",
      "placeholder": "AgACAgQAAxkBAAICPgr5jEVaGQACAnmEwb7rPXBIoDFpAAL4ujEbZm4xY_JvEGgpozt-AQADAgADeAADLwQ"
    },
    {
      "messageId": 124,
      "chatId": "123456789",
      "timestamp": "2023-04-12T10:45:22Z",
      "placeholder": "AgACAgQAAxkBAAICPgr5jEVaGQACBCdRTr9ZhfijeAAIujEbZm4xY_JvEGgpozt-AQADAgADeAADLwQ"
    }
  ]
}`,
    tabs: [
      {
        id: 'curl-web-upload',
        label: 'cURL',
        language: 'bash',
        code: `curl -X POST https://your-domain/api/v1/inweb/upload \\
  -F "image=@image1.jpg" \\
  -F "image=@image2.png" \\
  -F "chatId=123456789" \\
  -F "key=user123" \\
  -F "compress=true"`
      },
      {
        id: 'python-web-upload',
        label: 'Python',
        language: 'python',
        code: `import requests

url = "https://your-domain/api/v1/inweb/upload"

# Open files
files = [
    ('image', ('image1.jpg', open('path/to/image1.jpg', 'rb'), 'image/jpeg')),
    ('image', ('image2.png', open('path/to/image2.png', 'rb'), 'image/png'))
]

data = {
    'chatId': '123456789',
    'key': 'user123',
    'compress': 'true'
    # MongoDB URI and collection will use environment variables by default
}

response = requests.post(url, files=files, data=data)
print(response.json())`
      },
      {
        id: 'nodejs-web-upload',
        label: 'Node.js',
        language: 'javascript',
        code: `const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function webUploadFiles() {
  const formData = new FormData();
  
  // Add files
  formData.append('image', fs.createReadStream(path.join(__dirname, 'image1.jpg')));
  formData.append('image', fs.createReadStream(path.join(__dirname, 'image2.png')));
  
  // Add other fields
  formData.append('chatId', '123456789');
  formData.append('key', 'user123');
  formData.append('compress', 'true');
  
  try {
    const response = await axios.post(
      'https://your-domain/api/v1/inweb/upload',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );
    
    console.log(response.data);
  } catch (error) {
    console.error('Error uploading files:', error.response?.data || error.message);
  }
}

webUploadFiles();`
      }
    ]
  };
  
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900 border-b border-gray-700 shadow-lg">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-md bg-blue-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <h1 className="text-xl md:text-2xl font-semibold">File Management API</h1>
          </div>
          <div className="hidden md:block">
            <div className="text-sm text-gray-400">
              <span>Last Updated: 2025-04-12 11:05:59</span>
            </div>
          </div>
          <button 
            className="md:hidden p-2 text-gray-400 hover:text-white"
            onClick={() => setVisibleTOC(!visibleTOC)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className={`md:w-64 flex-shrink-0 ${visibleTOC ? 'block fixed inset-0 z-40 bg-gray-950 p-4' : 'hidden'} md:block md:sticky md:top-24 md:h-[calc(100vh-6rem)] overflow-auto`}>
          {visibleTOC && (
            <div className="flex justify-between items-center mb-4 md:hidden">
              <h2 className="text-lg font-semibold">Contents</h2>
              <button 
                onClick={() => setVisibleTOC(false)}
                className="p-2 text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <nav className="space-y-1">
            <div className="mb-4">
              <h3 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">Getting Started</h3>
              <ul className="space-y-1">
                {['introduction', 'authentication', 'base-url'].map((section) => (
                  <li key={section}>
                    <button
                      onClick={() => scrollToSection(section)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                        currentSection === section 
                          ? 'bg-blue-900/30 text-blue-400' 
                          : 'text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      {section.charAt(0).toUpperCase() + section.slice(1).replace(/-/g, ' ')}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mb-4">
              <h3 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">Endpoints</h3>
              <ul className="space-y-1">
                {[
                  'upload-files',
                  'retrieve-file-urls',
                  'retrieve-gallery',
                  'web-upload'
                ].map((section) => (
                  <li key={section}>
                    <button
                      onClick={() => scrollToSection(section)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                        currentSection === section 
                          ? 'bg-blue-900/30 text-blue-400' 
                          : 'text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      {section.charAt(0).toUpperCase() + section.slice(1).replace(/-/g, ' ')}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mb-4">
              <h3 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">Additional Information</h3>
              <ul className="space-y-1">
                {[
                  'data-models',
                  'error-handling',
                  'rate-limiting',
                  'best-practices'
                ].map((section) => (
                  <li key={section}>
                    <button
                      onClick={() => scrollToSection(section)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                        currentSection === section 
                          ? 'bg-blue-900/30 text-blue-400' 
                          : 'text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      {section.charAt(0).toUpperCase() + section.slice(1).replace(/-/g, ' ')}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 md:ml-8 mt-8 md:mt-0">
          <div className="prose prose-invert max-w-none">
            <section id="introduction" className="mb-16">
              <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-gray-700">Introduction</h2>
              <p className="mb-4">
                This API provides a comprehensive file management system that uses Telegram as a storage backend with MongoDB for metadata storage. 
                It enables applications to upload files, retrieve file URLs, and manage galleries of images.
              </p>
              <p className="mb-4">
                The API is designed to be flexible and can be integrated with various frontend frameworks and applications. 
                It supports features such as image compression, multi-file uploads, and gallery management.
              </p>
              <div className="bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-md my-6">
                <h4 className="font-medium text-blue-400 mb-2">Key Features</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-300">
                  <li>File uploads to Telegram with metadata storage in MongoDB</li>
                  <li>Optional image compression for faster loading</li>
                  <li>File URL retrieval for displaying images in applications</li>
                  <li>Gallery management with support for multiple chat sources</li>
                  <li>Support for multiple file formats (JPEG, PNG, WebP, GIF)</li>
                </ul>
              </div>
            </section>
            
            <section id="authentication" className="mb-16">
              <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-gray-700">Authentication</h2>
              <p className="mb-4">
                All API endpoints require authentication using a Telegram Bot API key and optionally a MongoDB URI.
                The API key must be included in the request body as <code>key</code> or <code>apiKey</code>.
              </p>
              <div className="bg-gray-800 p-6 rounded-lg mb-6">
                <h4 className="text-xl font-medium mb-4">Required Credentials</h4>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 pt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <span className="font-medium">Telegram Bot API Key:</span>
                      <p className="text-gray-400 mt-1">
                        Required for all endpoints to authenticate with Telegram. 
                        You can obtain this from <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">BotFather</a>.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 pt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <span className="font-medium">MongoDB URI:</span>
                      <p className="text-gray-400 mt-1">
                        Required for database operations. Some endpoints allow this to be specified as a parameter,
                        while others may use an environment variable.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-md">
                <h4 className="font-medium text-amber-400 mb-2">Security Notice</h4>
                <p className="text-gray-300">
                  Always keep your API keys and MongoDB URIs secure. Do not expose them in client-side code or public repositories.
                  Use environment variables or secure storage methods to manage these credentials.
                </p>
              </div>
            </section>
            
            <section id="base-url" className="mb-16">
              <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-gray-700">Base URL</h2>
              <p className="mb-4">
                All API endpoints are relative to the base URL:
              </p>
              <div className="bg-gray-800 p-4 rounded-lg mb-6 font-mono">
                https://your-domain.com/api/v1
              </div>
              <p className="mb-4">
                Replace <span className="font-mono">your-domain.com</span> with your actual domain name.
              </p>
              <div className="bg-gray-800 p-6 rounded-lg">
                <h4 className="text-xl font-medium mb-4">API Versioning</h4>
                <p className="mb-4">
                  The API uses versioning in the URL path (<span className="font-mono">v1</span>) to ensure backward compatibility.
                  Future versions may be released with different paths (e.g., <span className="font-mono">/api/v2/...</span>).
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-900 p-3 rounded-md">
                    <h5 className="font-medium text-blue-400 mb-2">Current Version</h5>
                    <p className="font-mono">v1</p>
                  </div>
                  <div className="bg-gray-900 p-3 rounded-md">
                    <h5 className="font-medium text-blue-400 mb-2">Release Date</h5>
                    <p>April 2025</p>
                  </div>
                </div>
              </div>
            </section>
            
            <section id="upload-files" className="mb-16">
              <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-gray-700">Endpoints</h2>
              <Endpoint {...uploadFileEndpoint} />
              <Endpoint {...retrieveFileEndpoint} />
              <Endpoint {...retrieveGalleryEndpoint} />
              <Endpoint {...webUploadEndpoint} />
            </section>
            
            <section id="data-models" className="mb-16">
              <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-gray-700">Data Models</h2>
              
              <div className="mb-8">
                <h3 className="text-2xl font-semibold mb-4">Gallery Item</h3>
                <p className="mb-4">
                  The base object used to store image metadata in MongoDB.
                </p>
                <SyntaxHighlighter language="json" style={vscDarkPlus} className="rounded-lg">
{`{
  "messageId": 123,
  "timestamp": "2023-04-12T10:43:51Z",
  "fileId": "AAQCABNmbjFjGAQAAgI-CvmMRVoZAAIC",
  "uploadedAt": "2023-04-12T10:43:51Z",
  "caption": "Amazing sunset",  // Optional
  "placeholder": "AgACAgQAAxkBAAICPgr5jEVaGQACAnmEwb7rPXBIoDFpAAL4ujEbZm4xY_JvEGgpozt-AQADAgADeAADLwQ"  // Optional
}`}
                </SyntaxHighlighter>
                <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden mt-4">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Field</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    <tr>
                      <td className="px-4 py-3 text-sm font-mono text-blue-400">messageId</td>
                      <td className="px-4 py-3 text-sm">Number</td>
                      <td className="px-4 py-3 text-sm text-gray-300">Telegram message ID containing the file</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-mono text-blue-400">timestamp</td>
                      <td className="px-4 py-3 text-sm">Date | String</td>
                      <td className="px-4 py-3 text-sm text-gray-300">Time when the message was sent to Telegram</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-mono text-blue-400">fileId</td>
                      <td className="px-4 py-3 text-sm">String</td>
                      <td className="px-4 py-3 text-sm text-gray-300">Telegram file ID for the uploaded file</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-mono text-blue-400">uploadedAt</td>
                      <td className="px-4 py-3 text-sm">Date | String</td>
                      <td className="px-4 py-3 text-sm text-gray-300">Time when the file was uploaded</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-mono text-blue-400">caption</td>
                      <td className="px-4 py-3 text-sm">String (optional)</td>
                      <td className="px-4 py-3 text-sm text-gray-300">Optional caption for the image</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-mono text-blue-400">placeholder</td>
                      <td className="px-4 py-3 text-sm">String (optional)</td>
                      <td className="px-4 py-3 text-sm text-gray-300">Telegram file ID for the compressed version of the image</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="mb-8">
                <h3 className="text-2xl font-semibold mb-4">Enhanced Gallery Item</h3>
                <p className="mb-4">
                  An extended version of the Gallery Item that includes file URLs for direct access.
                </p>
                <SyntaxHighlighter language="json" style={vscDarkPlus} className="rounded-lg">
{`{
  "messageId": 123,
  "timestamp": "2023-04-12T10:43:51Z",
  "caption": "Amazing sunset",
  "fileUrl": "https://api.telegram.org/file/bot<api_key>/documents/file_123.jpg",
  "uploadedAt": "2023-04-12T10:43:51Z",
  "placeholderFileId": "AgACAgQAAxkBAAICPgr5jEVaGQACAnmEwb7rPXBIoDFpAAL4ujEbZm4xY_JvEGgpozt-AQADAgADeAADLwQ",  // Optional
  "placeholderFileUrl": "https://api.telegram.org/file/bot<api_key>/photos/file_123_thumb.jpg"  // Optional
}`}
                </SyntaxHighlighter>
                <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden mt-4">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Field</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    <tr>
                      <td className="px-4 py-3 text-sm font-mono text-blue-400">messageId</td>
                      <td className="px-4 py-3 text-sm">Number</td>
                      <td className="px-4 py-3 text-sm text-gray-300">Telegram message ID containing the file</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-mono text-blue-400">timestamp</td>
                      <td className="px-4 py-3 text-sm">Date | String</td>
                      <td className="px-4 py-3 text-sm text-gray-300">Time when the message was sent to Telegram</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-mono text-blue-400">caption</td>
                      <td className="px-4 py-3 text-sm">String</td>
                      <td className="px-4 py-3 text-sm text-gray-300">Caption for the image (empty string if not present)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-mono text-blue-400">fileUrl</td>
                      <td className="px-4 py-3 text-sm">String | null</td>
                      <td className="px-4 py-3 text-sm text-gray-300">Direct URL to access the file on Telegram</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-mono text-blue-400">uploadedAt</td>
                      <td className="px-4 py-3 text-sm">Date | String</td>
                      <td className="px-4 py-3 text-sm text-gray-300">Time when the file was uploaded</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-mono text-blue-400">placeholderFileId</td>
                      <td className="px-4 py-3 text-sm">String (optional)</td>
                      <td className="px-4 py-3 text-sm text-gray-300">Telegram file ID for the compressed version</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-mono text-blue-400">placeholderFileUrl</td>
                      <td className="px-4 py-3 text-sm">String | null (optional)</td>
                      <td className="px-4 py-3 text-sm text-gray-300">Direct URL to access the compressed version</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="mb-8">
                <h3 className="text-2xl font-semibold mb-4">MongoDB Data Structure</h3>
                <p className="mb-4">
                  The following is an example of how data is structured in MongoDB:
                </p>
                <SyntaxHighlighter language="json" style={vscDarkPlus} className="rounded-lg">
{`{
  "userId": "user123",
  "apiKey": "your_telegram_bot_api_key",
  "lastUpdated": "2023-04-12T10:45:22Z",
  "galleries": {
    "123456789": [
      {
        "messageId": 123,
        "timestamp": "2023-04-12T10:43:51Z",
        "fileId": "AAQCABNmbjFjGAQAAgI-CvmMRVoZAAIC",
        "uploadedAt": "2023-04-12T10:43:51Z",
        "caption": "Amazing sunset",
        "placeholder": "AgACAgQAAxkBAAICPgr5jEVaGQACAnmEwb7rPXBIoDFpAAL4ujEbZm4xY_JvEGgpozt-AQADAgADeAADLwQ"
      },
      {
        "messageId": 124,
        "timestamp": "2023-04-12T10:45:22Z",
        "fileId": "AAQCABNmbjFjGAQBAgI-CcwN4RghAAIC",
        "uploadedAt": "2023-04-12T10:45:22Z",
        "caption": "Beautiful landscape",
        "placeholder": "AgACAgQAAxkBAAICPgr5jEVaGQACBCdRTr9ZhfijeAAIujEbZm4xY_JvEGgpozt-AQADAgADeAADLwQ"
      }
    ],
    "987654321": [
      {
        "messageId": 125,
        "timestamp": "2023-04-12T11:30:15Z",
        "fileId": "AAQCABNmbjFjGAQCAgI-DdwM5RtuAAIC",
        "uploadedAt": "2023-04-12T11:30:15Z",
        "caption": "Office meeting",
        "placeholder": "AgACAgQAAxkBAAICPgr5jEVaGQACCFmHxc8qQeCJpDGrACL5ujEbZm4xY_JvEGpppar-AQADAgADfAADLwQ"
      }
    ]
  }
}`}
                </SyntaxHighlighter>
                <p className="text-gray-400 mt-4">
                  This structure allows efficient storage and retrieval of images by user and chat ID. The <code>galleries</code> object 
                  contains chat IDs as keys, with each value being an array of Gallery Item objects.
                </p>
              </div>
            </section>
            
            <section id="error-handling" className="mb-16">
              <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-gray-700">Error Handling</h2>
              <p className="mb-4">
                The API uses standard HTTP status codes to indicate the success or failure of requests. 
                Error responses include a message field that provides additional information about the error.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-xl font-medium mb-4 text-red-400">Common Error Codes</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <div className="flex-shrink-0 pt-1">
                        <span className="inline-block w-6 h-6 rounded-full bg-red-900/60 text-red-400 text-xs flex items-center justify-center font-semibold">400</span>
                      </div>
                      <div className="ml-3">
                        <span className="font-medium text-red-400">Bad Request</span>
                        <p className="text-gray-400 mt-1">
                          Missing or invalid parameters.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 pt-1">
                        <span className="inline-block w-6 h-6 rounded-full bg-amber-900/60 text-amber-400 text-xs flex items-center justify-center font-semibold">429</span>
                      </div>
                      <div className="ml-3">
                        <span className="font-medium text-amber-400">Too Many Requests</span>
                        <p className="text-gray-400 mt-1">
                          Rate limit exceeded. The API implements retry mechanisms for these errors.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 pt-1">
                        <span className="inline-block w-6 h-6 rounded-full bg-red-900/60 text-red-400 text-xs flex items-center justify-center font-semibold">500</span>
                      </div>
                      <div className="ml-3">
                        <span className="font-medium text-red-400">Internal Server Error</span>
                        <p className="text-gray-400 mt-1">
                          An unexpected error occurred on the server.
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-xl font-medium mb-4">Example Error Response</h3>
                  <SyntaxHighlighter language="json" style={vscDarkPlus} className="rounded-lg">
{`{
  "message": "Missing required fields",
  "error": "chatId is required"
}`}
                  </SyntaxHighlighter>
                  <p className="text-gray-400 mt-4">
                    The <code>message</code> field provides a human-readable description of the error, 
                    while the optional <code>error</code> field may contain more detailed information.
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-medium mb-4">Handling Errors in Clients</h3>
                <SyntaxHighlighter language="javascript" style={vscDarkPlus} className="rounded-lg mb-6">
{`// Example error handling in JavaScript
async function uploadFile() {
  try {
    const response = await fetch('https://your-domain/api/v1/files/upload', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Handle error based on status code
      switch (response.status) {
        case 400:
          console.error('Bad request:', data.message);
          // Show validation error to user
          break;
        case 429:
          console.error('Rate limited:', data.message);
          // Implement exponential backoff or inform user to try later
          break;
        case 500:
          console.error('Server error:', data.message);
          // Show generic error message to user
          break;
        default:
          console.error('Unknown error:', data.message);
          break;
      }
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Network error:', error);
    // Handle network or parsing errors
    return null;
  }
}`}
                </SyntaxHighlighter>
              </div>
            </section>
            
            <section id="rate-limiting" className="mb-16">
              <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-gray-700">Rate Limiting</h2>
              <p className="mb-4">
                The API automatically handles rate limits from Telegram's API using retry mechanisms. 
                When these limits are encountered, requests are automatically retried with increasing delays.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-xl font-medium mb-4">Telegram API Limits</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <div className="flex-shrink-0 pt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <span className="font-medium">Message Sending</span>
                        <p className="text-gray-400 mt-1">
                          Limit of 30 messages per second to the same chat.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 pt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <span className="font-medium">File Uploads</span>
                        <p className="text-gray-400 mt-1">
                          Limit of 20 uploads per minute per bot.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 pt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <span className="font-medium">File Size</span>
                        <p className="text-gray-400 mt-1">
                          Maximum file size of 50MB for regular bots.
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-xl font-medium mb-4">Retry Strategy</h3>
                  <p className="text-gray-400 mb-4">
                    When a rate limit is encountered, the API automatically retries the request with an exponential backoff strategy:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li>First retry: 1 second delay</li>
                    <li>Second retry: 2 seconds delay</li>
                    <li>Third retry: 3 seconds delay</li>
                  </ul>
                  <div className="mt-4 p-3 bg-yellow-900/30 text-yellow-400 rounded">
                    <strong>Note:</strong> After three failed attempts, the API will return a 429 error to the client.
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-medium mb-4">Client-Side Recommendations</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-medium mb-2 text-blue-400">Implement Throttling</h4>
                    <p className="text-gray-300">
                      When uploading multiple files, implement client-side throttling to avoid hitting rate limits.
                      Consider adding delays between requests, especially for batch operations.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium mb-2 text-blue-400">Handle 429 Responses</h4>
                    <p className="text-gray-300">
                      Implement proper handling of 429 responses, including exponential backoff and retry mechanisms.
                    </p>
                    <SyntaxHighlighter language="javascript" style={vscDarkPlus} className="rounded-lg mt-3">
{`// Example exponential backoff implementation
async function fetchWithRetry(url, options, maxRetries = 5) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const response = await fetch(url, options);
      
      if (response.status !== 429) {
        return response;
      }
      
      // Calculate delay using exponential backoff
      const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000;
      console.log(\`Rate limited. Retrying in \${delay}ms (retry \${retries + 1}/\${maxRetries})\`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      retries++;
    } catch (error) {
      if (retries >= maxRetries - 1) throw error;
      retries++;
    }
  }
  
  throw new Error('Max retries reached');
}`}
                    </SyntaxHighlighter>
                  </div>
                </div>
              </div>
            </section>
            
            <section id="best-practices" className="mb-16">
              <h2 className="text-3xl font-bold mb-6 pb-2 border-b border-gray-700">Best Practices</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-900/60 flex items-center justify-center text-blue-400 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-medium">Security</h3>
                  </div>
                  <ul className="space-y-3 ml-2">
                    <li className="flex items-start">
                      <div className="flex-shrink-0 pt-1 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-300">
                        Store sensitive information like API keys and MongoDB URIs as environment variables.
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 pt-1 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-300">
                        Implement proper authentication and authorization in your application.
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 pt-1 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-300">
                        Validate all user inputs on both client and server sides.
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 pt-1 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-300">
                        Use HTTPS for all API requests.
                      </p>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-green-900/60 flex items-center justify-center text-green-400 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-medium">Performance</h3>
                  </div>
                  <ul className="space-y-3 ml-2">
                    <li className="flex items-start">
                      <div className="flex-shrink-0 pt-1 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-300">
                        Use the <code>compress</code> option for faster image loading in web applications.
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 pt-1 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-300">
                        Implement client-side caching for frequently accessed files.
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 pt-1 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-300">
                        Use pagination when retrieving large galleries.
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 pt-1 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-300">
                        Optimize MongoDB queries with proper indexing.
                      </p>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-purple-900/60 flex items-center justify-center text-purple-400 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-medium">Error Handling</h3>
                  </div>
                  <ul className="space-y-3 ml-2">
                    <li className="flex items-start">
                      <div className="flex-shrink-0 pt-1 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-300">
                        Implement comprehensive error handling on both server and client sides.
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 pt-1 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-300">
                        Provide meaningful error messages to users.
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 pt-1 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-300">
                        Log errors for debugging and monitoring.
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 pt-1 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-300">
                        Implement retry mechanisms for transient errors.
                      </p>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-amber-900/60 flex items-center justify-center text-amber-400 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-medium">Implementation Tips</h3>
                  </div>
                  <ul className="space-y-3 ml-2">
                    <li className="flex items-start">
                      <div className="flex-shrink-0 pt-1 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-300">
                        Display placeholder images while loading high-resolution images.
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 pt-1 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-300">
                        Implement lazy loading for galleries with many images.
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 pt-1 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-300">
                        Use a consistent error handling approach across your application.
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 pt-1 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-300">
                        Implement a session management strategy to optimize MongoDB connections.
                      </p>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-medium mb-4">Example Code</h3>
                <p className="text-gray-300 mb-4">
                  Here's an example React component that uses the Upload and Gallery endpoints:
                </p>
                <SyntaxHighlighter language="jsx" style={vscDarkPlus} className="rounded-lg">
{`import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'https://your-domain/api/v1';

const FileManager = ({ apiKey, userId, chatId }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [gallery, setGallery] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load gallery on component mount
  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    setGalleryLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(\`\${API_BASE_URL}/inweb/gallery\`, {
        apiKey,
        userId,
        chatId,
        mongouri: process.env.NEXT_PUBLIC_MONGODB_URI
      });
      
      const galleryData = response.data.galleryData[chatId] || [];
      setGallery(galleryData);
    } catch (err) {
      console.error('Error fetching gallery:', err);
      setError('Failed to load gallery. Please try again.');
    } finally {
      setGalleryLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    if (!files.length) return;
    
    setLoading(true);
    setError(null);
    setUploadProgress(0);
    
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('image', file);
    });
    
    formData.append('chatId', chatId);
    formData.append('key', userId);
    formData.append('compress', 'true');
    
    try {
      const response = await axios.post(
        \`\${API_BASE_URL}/inweb/upload\`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
        }
      );
      
      console.log('Upload successful:', response.data);
      
      // Refresh gallery after upload
      fetchGallery();
      
      // Reset file input
      setFiles([]);
    } catch (err) {
      console.error('Error uploading files:', err);
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">File Manager</h2>
      
      <div className="bg-gray-100 p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-semibold mb-4">Upload Files</h3>
        
        <div className="mb-4">
          <label className="block mb-2 font-medium">Select Images:</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="border p-2 w-full rounded"
            disabled={loading}
          />
        </div>
        
        {files.length > 0 && (
          <div className="mb-4">
            <p className="font-medium mb-2">{files.length} file(s) selected</p>
            <ul className="text-sm text-gray-600 space-y-1">
              {files.map((file, index) => (
                <li key={index}>
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {loading && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: \`\${uploadProgress}%\` }}
              ></div>
            </div>
            <p className="text-center text-sm mt-1">
              {uploadProgress}% Uploaded
            </p>
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <button
          onClick={handleUpload}
          disabled={loading || !files.length}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      
      <div className="bg-gray-100 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Gallery</h3>
        
        {galleryLoading ? (
          <p className="text-center py-8">Loading gallery...</p>
        ) : gallery.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {gallery.map((item) => (
              <div key={item.messageId} className="relative">
                <img
                  src={item.placeholderFileUrl || item.fileUrl}
                  alt={item.caption || \`Image \${item.messageId}\`}
                  className="w-full h-40 object-cover rounded-lg"
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder-image.jpg';
                  }}
                />
                {item.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 text-white text-sm rounded-b-lg truncate">
                    {item.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-8 text-gray-500">
            No images found. Upload some images to see them here.
          </p>
        )}
      </div>
    </div>
  );
};

export default FileManager;`}
                </SyntaxHighlighter>
              </div>
            </section>
            
            <footer className="border-t border-gray-700 pt-8 mt-16">
              <div className="text-center text-gray-400">
                <p className="mb-4">API Documentation | Last Updated: {new Date('2025-04-12 11:30:36').toLocaleString()}</p>
                <p className="text-sm">Current User: nanda-kshr</p>
              </div>
              <div className="flex justify-center space-x-4 mt-6 text-gray-400">
                <a href="#" className="hover:text-white transition-colors duration-200">Terms</a>
                <a href="#" className="hover:text-white transition-colors duration-200">Privacy</a>
                <a href="#" className="hover:text-white transition-colors duration-200">Contact</a>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

export default APIDocumentationPage;