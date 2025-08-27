import React, { useState } from 'react';
import { Upload, FileText, Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)',
    padding: '2rem 1rem'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    padding: '2rem',
    marginBottom: '1.5rem'
  },
  button: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px'
  },
  uploadArea: {
    border: '2px dashed #d1d5db',
    borderRadius: '8px',
    padding: '3rem',
    textAlign: 'center',
    cursor: 'pointer'
  }
};

const DocumentAssistant = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [extractionQuery, setExtractionQuery] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isMultipleMode, setIsMultipleMode] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [reportGenerated, setReportGenerated] = useState(false);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    
    if (files.length > 0) {
      if (files.length === 1) {
        setUploadedFile(files[0]);
        setUploadedFiles([]);
        setIsMultipleMode(false);
      } else {
        setUploadedFiles(files);
        setUploadedFile(null);
        setIsMultipleMode(true);
      }
      setCurrentStep(2);
    }
  };

  const handleExtraction = async () => {
    if (!extractionQuery.trim() || (!uploadedFile && uploadedFiles.length === 0)) return;
    
    setProcessing(true);
    setCurrentStep(3);
    
    const formData = new FormData();
    
    // Add files to form data
    if (isMultipleMode) {
      uploadedFiles.forEach(file => {
        formData.append('filess', file);
      });
    } else {
      formData.append('filess', uploadedFile);
    }
    
    formData.append('query', extractionQuery);
    
    try {
      const response = await fetch('http://localhost:8080/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.status === 'success') {
          // Handle different data formats from backend
          let extractedData = result.extracted_data;
          let columns = [];
          let rows = 0;
          let preview = [];
          
          if (Array.isArray(extractedData) && extractedData.length > 0) {
            // Data is an array of objects
            rows = extractedData.length;
            columns = Object.keys(extractedData[0]);
            preview = extractedData.slice(0, 5);
          } else if (extractedData && typeof extractedData === 'object') {
            // Data is a single object, convert to array
            rows = 1;
            columns = Object.keys(extractedData);
            preview = [extractedData];
            extractedData = [extractedData];
          } else {
            // Fallback for other data formats
            rows = 0;
            columns = ['Data'];
            preview = [];
            extractedData = [];
          }
          
          setExtractedData({
            rows,
            columns,
            preview,
            download_url: result.download_url,
            full_data: extractedData
          });
          setCurrentStep(4);
        } else {
          throw new Error(result.message || 'Extraction failed');
        }
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Extraction failed');
      }
    } catch (error) {
      console.error('Extraction failed:', error);
      alert(`Extraction failed: ${error.message}`);
      setCurrentStep(2); // Go back to step 2
    } finally {
      setProcessing(false);
    }
  };

  const generateReport = async () => {
    setProcessing(true);
    
    // For now, generate a simple report based on extracted data
    try {
      // Simulate report generation since your backend doesn't have this endpoint yet
      setTimeout(() => {
        setReportGenerated(true);
        setCurrentStep(5);
        setProcessing(false);
      }, 2000);
    } catch (error) {
      console.error('Report generation failed:', error);
      alert('Report generation failed. Please try again.');
      setProcessing(false);
    }
  };

  const downloadExcel = async () => {
    if (!extractedData?.download_url) {
      alert('No Excel file available for download');
      return;
    }
    
    try {
      // Extract filename from download_url (e.g., "/download/filename.xlsx")
      const filename = extractedData.download_url.split('/').pop();
      
      const response = await fetch(`http://localhost:8080/download/${filename}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
        
        // Optional: Clean up the file on server
        await fetch(`http://localhost:8080/cleanup/${filename}`, { method: 'DELETE' });
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Excel download failed:', error);
      alert('Excel download failed. Please try again.');
    }
  };

  const downloadReport = async () => {
    if (!extractedData?.full_data) {
      alert('No data available for report generation');
      return;
    }
    
    // Generate a simple text report since PDF generation isn't in your backend yet
    const reportContent = generateTextReport(extractedData.full_data);
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analysis_report.txt';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateTextReport = (data) => {
    if (!data || data.length === 0) return 'No data available for report.';
    
    const totalRows = data.length;
    const columns = Object.keys(data[0]);
    
    let report = `DOCUMENT ANALYSIS REPORT\n`;
    report += `Generated: ${new Date().toLocaleString()}\n`;
    report += `Query: ${extractionQuery}\n\n`;
    
    report += `EXECUTIVE SUMMARY\n`;
    report += `- Total records extracted: ${totalRows}\n`;
    report += `- Data fields identified: ${columns.join(', ')}\n\n`;
    
    report += `DETAILED DATA\n`;
    data.forEach((row, index) => {
      report += `\nRecord ${index + 1}:\n`;
      Object.entries(row).forEach(([key, value]) => {
        report += `  ${key}: ${value}\n`;
      });
    });
    
    return report;
  };

  return (
    <div style={styles.container}>
      <div style={{maxWidth: '1200px', margin: '0 auto'}}>
        <header style={{textAlign: 'center', marginBottom: '2rem'}}>
          <h1 style={{fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem'}}>
            AI Document Assistant
          </h1>
          <p style={{color: '#6b7280', maxWidth: '600px', margin: '0 auto'}}>
            Extract exactly what you need from documents in plain English, convert to Excel, and generate actionable reports
          </p>
        </header>

        {/* Progress Steps */}
        <div style={{display: 'flex', justifyContent: 'center', marginBottom: '3rem'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
            {[1, 2, 3, 4].map((step) => (
              <div key={step} style={{display: 'flex', alignItems: 'center'}}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  backgroundColor: currentStep >= step ? '#2563eb' : '#e5e7eb',
                  color: currentStep >= step ? 'white' : '#6b7280'
                }}>
                  {step}
                </div>
                {step < 4 && (
                  <div style={{
                    width: '48px',
                    height: '4px',
                    backgroundColor: currentStep > step ? '#2563eb' : '#e5e7eb',
                    marginLeft: '8px'
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Upload Document */}
        {currentStep >= 1 && (
          <div style={styles.card}>
            <div style={{display: 'flex', alignItems: 'center', marginBottom: '1rem'}}>
              <Upload size={24} color="#2563eb" style={{marginRight: '12px'}} />
              <h2 style={{fontSize: '1.25rem', fontWeight: '600', margin: 0}}>Step 1: Upload Document</h2>
              {uploadedFile && <CheckCircle size={20} color="#10b981" style={{marginLeft: 'auto'}} />}
            </div>
            
            {!uploadedFile ? (
              <div style={styles.uploadArea}>
                <FileText size={64} color="#9ca3af" style={{margin: '0 auto 1rem'}} />
                <p style={{color: '#6b7280', marginBottom: '1rem'}}>Upload your document (PDF, Word, Image)</p>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                  style={{display: 'none'}}
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  style={styles.button}
                >
                  Choose File
                </label>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem',
                backgroundColor: '#f0fdf4',
                borderRadius: '8px',
                border: '1px solid #bbf7d0'
              }}>
                <FileText size={32} color="#059669" style={{marginRight: '12px'}} />
                <div>
                  <p style={{fontWeight: '500', color: '#065f46', margin: 0}}>{uploadedFile.name}</p>
                  <p style={{fontSize: '14px', color: '#059669', margin: 0}}>
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Extraction Query */}
        {currentStep >= 2 && (
          <div style={styles.card}>
            <div style={{display: 'flex', alignItems: 'center', marginBottom: '1rem'}}>
              <FileText size={24} color="#2563eb" style={{marginRight: '12px'}} />
              <h2 style={{fontSize: '1.25rem', fontWeight: '600', margin: 0}}>
                Step 2: What data do you want to extract{isMultipleMode ? ' from all documents' : ''}?
              </h2>
              {extractionQuery && currentStep > 2 && (
                <CheckCircle size={20} color="#10b981" style={{marginLeft: 'auto'}} />
              )}
            </div>
            
            <div style={{marginBottom: '1rem'}}>
              <textarea
                value={extractionQuery}
                onChange={(e) => setExtractionQuery(e.target.value)}
                placeholder={isMultipleMode 
                  ? "Describe what data you want to extract from all documents. For example: 'Extract all company names, revenue figures, and contract dates from these documents and combine them into one table'"
                  : "Describe what data you want to extract in plain English. For example: 'Extract all company names, their revenue figures, and contract dates from this document'"
                }
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  resize: 'none',
                  fontSize: '16px'
                }}
                rows="4"
                disabled={currentStep > 2}
              />
            </div>
            
            {currentStep === 2 && (
              <button
                onClick={handleExtraction}
                disabled={!extractionQuery.trim()}
                style={{
                  ...styles.button,
                  opacity: !extractionQuery.trim() ? 0.5 : 1,
                  cursor: !extractionQuery.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                Extract Data
              </button>
            )}
          </div>
        )}

        {/* Step 3: Processing */}
        {currentStep === 3 && processing && (
          <div style={styles.card}>
            <div style={{display: 'flex', alignItems: 'center', marginBottom: '1rem'}}>
              <Loader2 size={24} color="#2563eb" style={{marginRight: '12px', animation: 'spin 1s linear infinite'}} />
              <h2 style={{fontSize: '1.25rem', fontWeight: '600', margin: 0}}>
                Step 3: Processing Document{isMultipleMode ? 's' : ''}
              </h2>
            </div>
            
            <div style={{textAlign: 'center', padding: '2rem'}}>
              <Loader2 size={48} color="#2563eb" style={{margin: '0 auto 1rem', animation: 'spin 1s linear infinite'}} />
              <p style={{color: '#6b7280'}}>
                {isMultipleMode 
                  ? `Analyzing ${uploadedFiles.length} documents and extracting requested data...`
                  : 'Analyzing document and extracting requested data...'
                }
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Preview Extracted Data */}
        {currentStep >= 4 && extractedData && (
          <div style={styles.card}>
            <div style={{display: 'flex', alignItems: 'center', marginBottom: '1rem'}}>
              <CheckCircle size={24} color="#10b981" style={{marginRight: '12px'}} />
              <h2 style={{fontSize: '1.25rem', fontWeight: '600', margin: 0}}>
                Step 4: Extracted Data Preview {isMultipleMode ? '(Combined from all documents)' : ''}
              </h2>
            </div>
            
            <div style={{marginBottom: '1rem'}}>
              <div style={{display: 'flex', gap: '2rem', fontSize: '14px', color: '#6b7280', marginBottom: '1rem'}}>
                <span>Rows: {extractedData.rows}</span>
                <span>Columns: {extractedData.columns.length}</span>
              </div>
              
              <div style={{overflowX: 'auto'}}>
                <table style={{width: '100%', border: '1px solid #e5e7eb', borderCollapse: 'collapse', borderRadius: '8px'}}>
                  <thead style={{backgroundColor: '#f9fafb'}}>
                    <tr>
                      {extractedData.columns.map((col, idx) => (
                        <th key={idx} style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#374151',
                          borderBottom: '1px solid #e5e7eb'
                        }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {extractedData.preview.map((row, idx) => (
                      <tr key={idx} style={{borderBottom: '1px solid #e5e7eb'}}>
                        {extractedData.columns.map((col, cellIdx) => (
                          <td key={cellIdx} style={{
                            padding: '12px 16px',
                            fontSize: '14px',
                            color: '#1f2937'
                          }}>
                            {typeof row === 'object' ? 
                              (typeof row[col] === 'object' && row[col] !== null ? 
                                (row[col].value !== undefined ? row[col].value : JSON.stringify(row[col])) 
                                : row[col]
                              ) 
                              : row[cellIdx] || ''
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div style={{display: 'flex', gap: '1rem', paddingTop: '1rem'}}>
                <button
                  onClick={() => downloadExcel()}
                  style={{
                    ...styles.button,
                    backgroundColor: '#059669'
                  }}
                >
                  <Download size={16} />
                  Download Excel
                </button>
                
              </div>
            </div>
          </div>
        )}

      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DocumentAssistant;