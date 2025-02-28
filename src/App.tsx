import { useState, useRef, useEffect } from 'react'
import { Download, X, BarChart, Printer, ArrowLeft, Eye } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import './App.css'

interface Service {
  name: string;
  price: number;
}

interface InvoiceStats {
  generated: number;
  printed: number;
  downloaded: number;
  cancelled: number;
}

interface InvoiceData {
  id: string;
  date: string;
  clientName: string;
  businessName: string;
  amount: number;
  services: Record<string, number>;
}

function App() {
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({});
  const [showInvoice, setShowInvoice] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isPrinting, setIsPrinting] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [stats, setStats] = useState<InvoiceStats>(() => {
    const savedStats = localStorage.getItem('invoiceStats');
    return savedStats ? JSON.parse(savedStats) : {
      generated: 0,
      printed: 0,
      downloaded: 0,
      cancelled: 0
    };
  });
  const [invoices, setInvoices] = useState<InvoiceData[]>(() => {
    const savedInvoices = localStorage.getItem('invoiceHistory');
    return savedInvoices ? JSON.parse(savedInvoices) : [];
  });
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('invoiceStats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('invoiceHistory', JSON.stringify(invoices));
  }, [invoices]);

  const services: Service[] = [
    { name: "Primary Video", price: 1500 },
    { name: "Acting Video Content", price: 6500 },
    { name: "Animated Graphics", price: 800 },
    { name: "Account Handling", price: 2000 },
    { name: "SEO Management", price: 1000 },
    { name: "Primary Website", price: 18000 },
    { name: "Premium Website", price: 22000 },
    { name: "E-Commerce Website", price: 39000 }
  ];

  const addToTotal = (service: string, price: number) => {
    setSelectedServices(prev => ({
      ...prev,
      [service]: (prev[service] || 0) + 1
    }));
  };

  const removeService = (service: string) => {
    setSelectedServices(prev => {
      const updated = { ...prev };
      if (updated[service] > 1) {
        updated[service] -= 1;
      } else {
        delete updated[service];
      }
      return updated;
    });
  };

  const calculateSubtotal = (servicesObj = selectedServices) => {
    return Object.entries(servicesObj).reduce((total, [service, quantity]) => {
      const serviceObj = services.find(s => s.name === service);
      return total + (serviceObj?.price || 0) * quantity;
    }, 0);
  };

  const calculateDiscount = (subtotal = calculateSubtotal()) => {
    return Math.round(subtotal * (discountPercent / 100));
  };

  const calculateTotal = (servicesObj = selectedServices) => {
    const subtotal = calculateSubtotal(servicesObj);
    const discount = Math.round(subtotal * (discountPercent / 100));
    const afterDiscount = subtotal - discount;
    const gst = Math.round(afterDiscount * 0.18);
    return afterDiscount + gst;
  };

  const today = new Date();
  const invoiceDate = formatDate(today);
  // Create a new date object to avoid modifying the original
  const dueDateObj = new Date(today);
  dueDateObj.setDate(dueDateObj.getDate() + 30);
  const dueDate = formatDate(dueDateObj);
  const invoiceNumber = `CT-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

  const generateInvoice = () => {
    const newInvoice: InvoiceData = {
      id: invoiceNumber,
      date: invoiceDate,
      clientName,
      businessName,
      amount: calculateTotal(),
      services: {...selectedServices}
    };
    
    setInvoices(prev => [...prev, newInvoice]);
    setShowInvoice(true);
    setStats(prev => ({
      ...prev,
      generated: prev.generated + 1
    }));
    toast.success('Invoice generated successfully!');
  };

  const printInvoice = () => {
    setIsPrinting(true);
    const invoiceContent = invoiceRef.current;
    if (!invoiceContent) {
      setIsPrinting(false);
      return;
    }

    const originalContents = document.body.innerHTML;
    const printContents = invoiceContent.innerHTML;
    
    document.body.innerHTML = printContents;
    window.print();
    
    // Restore the original content after printing
    document.body.innerHTML = originalContents;
    
    // Re-render the component
    setTimeout(() => {
      setIsPrinting(false);
      setStats(prev => ({
        ...prev,
        printed: prev.printed + 1
      }));
      toast.success('Invoice printed successfully!');
    }, 500);
  };

  const downloadInvoice = () => {
    setIsPrinting(true);
    const invoiceContent = invoiceRef.current;
    if (!invoiceContent) {
      setIsPrinting(false);
      return;
    }

    // Create a hidden iframe for PDF generation
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      setIsPrinting(false);
      return;
    }
    
    // Add necessary styles and content for the PDF
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cyber Tree Invoice - ${invoiceNumber}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #333;
              line-height: 1.5;
              padding: 20px;
            }
            .invoice {
              max-width: 800px;
              margin: 0 auto;
            }
            .invoice-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .company-info h1 {
              margin: 0;
              color: #2563eb;
            }
            .company-info p {
              margin: 5px 0;
            }
            .invoice-title h2 {
              margin: 0;
              color: #2563eb;
            }
            .invoice-details {
              margin-top: 10px;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .invoice-client {
              margin-bottom: 30px;
            }
            .invoice-client h3 {
              color: #2563eb;
              margin-bottom: 10px;
            }
            .invoice-items table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            .invoice-items th, .invoice-items td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
            }
            .invoice-items th {
              background-color: #f8fafc;
            }
            .invoice-summary {
              margin-left: auto;
              width: 300px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
            }
            .total {
              font-weight: bold;
              font-size: 1.2em;
              border-top: 2px solid #ddd;
              padding-top: 10px;
            }
            .invoice-footer {
              margin-top: 50px;
              text-align: center;
              color: #666;
              font-size: 0.9em;
            }
          </style>
        </head>
        <body>
          ${invoiceContent.innerHTML}
        </body>
      </html>
    `);
    
    iframeDoc.close();
    
    // Use setTimeout to ensure the content is fully loaded
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      
      // Remove the iframe after printing
      setTimeout(() => {
        document.body.removeChild(iframe);
        setIsPrinting(false);
        setStats(prev => ({
          ...prev,
          downloaded: prev.downloaded + 1
        }));
        toast.success('Invoice downloaded successfully!');
      }, 100);
    }, 250);
  };

  const closeInvoice = () => {
    if (isPrinting) {
      toast.error('Please wait for the current operation to complete');
      return;
    }
    setShowInvoice(false);
  };

  const cancelInvoice = () => {
    if (isPrinting) {
      toast.error('Please wait for the current operation to complete');
      return;
    }
    setShowInvoice(false);
    setStats(prev => ({
      ...prev,
      cancelled: prev.cancelled + 1
    }));
    toast.error('Invoice cancelled');
  };

  const toggleAdminDashboard = () => {
    setShowAdminDashboard(prev => !prev);
    setSelectedInvoice(null);
  };

  const viewInvoiceDetails = (invoice: InvoiceData) => {
    setSelectedInvoice(invoice);
  };

  const backToInvoiceList = () => {
    setSelectedInvoice(null);
  };

  const resetStats = () => {
    setStats({
      generated: 0,
      printed: 0,
      downloaded: 0,
      cancelled: 0
    });
    toast.success('Statistics reset successfully');
  };

  const clearInvoiceHistory = () => {
    setInvoices([]);
    toast.success('Invoice history cleared successfully');
  };

  function formatDate(date: Date) {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  if (showAdminDashboard) {
    if (selectedInvoice) {
      return (
        <div className="admin-container">
          <Toaster position="top-right" />
          <div className="admin-header">
            <h1>Invoice Details</h1>
            <div className="admin-header-actions">
              <button className="admin-btn" onClick={toggleAdminDashboard}>
                <BarChart size={16} /> Admin Dashboard
              </button>
              <button className="back-btn" onClick={backToInvoiceList}>
                <ArrowLeft size={16} /> Back to Invoice List
              </button>
            </div>
          </div>
          
          <div className="invoice admin-invoice" ref={invoiceRef}>
            <div className="invoice-header">
              <div className="company-info">
                <h1>Cyber Tree</h1>
                <p>Digital Solutions Provider</p>
                <p>contact@cybertree.com</p>
                <p>+91 98765 43210</p>
              </div>
              <div className="invoice-title">
                <h2>INVOICE</h2>
                <div className="invoice-details">
                  <div className="detail-row">
                    <span className="detail-label">Invoice #:</span>
                    <span className="detail-value">{selectedInvoice.id}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">{selectedInvoice.date}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Due Date:</span>
                    <span className="detail-value">{dueDate}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="invoice-client">
              <h3>Bill To:</h3>
              {selectedInvoice.businessName && <p className="client-business">{selectedInvoice.businessName}</p>}
              <p className="client-name">{selectedInvoice.clientName}</p>
            </div>
            
            <div className="invoice-items">
              <table>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(selectedInvoice.services).map(([service, quantity]) => {
                    const serviceObj = services.find(s => s.name === service);
                    const price = serviceObj?.price || 0;
                    return (
                      <tr key={service}>
                        <td>{service}</td>
                        <td>{quantity}</td>
                        <td>₹{price.toLocaleString()}</td>
                        <td>₹{(price * quantity).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="invoice-summary">
              <div className="summary-row total">
                <span className="summary-label">Total:</span>
                <span className="summary-value">₹{selectedInvoice.amount.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="invoice-footer">
              <p>Thank you for your business!</p>
              <p>Payment is due within 30 days. Please make payment to:</p>
              <p>Bank: HDFC Bank | Account: 12345678901234 | IFSC: HDFC0001234</p>
            </div>
          </div>
          
          <div className="admin-actions">
            <button className="print-btn" onClick={printInvoice}>
              <Printer size={16} /> Print Invoice
            </button>
            <button className="download-btn" onClick={downloadInvoice}>
              <Download size={16} /> Download PDF
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="admin-container">
        <Toaster position="top-right" />
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <button className="back-btn" onClick={toggleAdminDashboard}>
            <ArrowLeft size={16} /> Back to Calculator
          </button>
        </div>
        
        <div className="stats-container">
          <div className="stats-card">
            <h2>Invoice Statistics</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{stats.generated}</div>
                <div className="stat-label">Generated</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.printed}</div>
                <div className="stat-label">Printed</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.downloaded}</div>
                <div className="stat-label">Downloaded</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.cancelled}</div>
                <div className="stat-label">Cancelled</div>
              </div>
            </div>
          </div>
          
          <div className="stats-chart">
            <h2>Visual Representation</h2>
            <div className="chart-container">
              {['generated', 'printed', 'downloaded', 'cancelled'].map((type) => (
                <div key={type} className="chart-bar-container">
                  <div className="chart-label">{type.charAt(0).toUpperCase() + type.slice(1)}</div>
                  <div className="chart-bar-wrapper">
                    <div 
                      className={`chart-bar chart-bar-${type}`} 
                      style={{ 
                        width: `${stats[type as keyof InvoiceStats] > 0 
                          ? (stats[type as keyof InvoiceStats] / Math.max(...Object.values(stats)) * 100) 
                          : 0}%` 
                      }}
                    >
                      {stats[type as keyof InvoiceStats]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="invoice-history">
          <div className="history-header">
            <h2>Invoice History</h2>
            {invoices.length > 0 && (
              <button className="clear-btn" onClick={clearInvoiceHistory}>Clear History</button>
            )}
          </div>
          
          {invoices.length > 0 ? (
            <div className="invoice-list">
              <table>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Company</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>{invoice.id}</td>
                      <td>{invoice.date}</td>
                      <td>{invoice.clientName}</td>
                      <td>{invoice.businessName || '-'}</td>
                      <td>₹{invoice.amount.toLocaleString()}</td>
                      <td>
                        <button 
                          className="view-btn"
                          onClick={() => viewInvoiceDetails(invoice)}
                        >
                          <Eye size={16} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-invoices">
              <p>No invoices have been generated yet.</p>
            </div>
          )}
        </div>
        
        <div className="admin-actions">
          <button className="reset-btn" onClick={resetStats}>Reset Statistics</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      {!showInvoice ? (
        <div className="pricing-container">
          <header>
            <h1>Cyber Tree Pricing</h1>
            <p className="subtitle">Select services to calculate your package</p>
            <button className="admin-btn" onClick={toggleAdminDashboard}>
              <BarChart size={16} /> Admin Dashboard
            </button>
          </header>

          <div className="services-grid">
            {services.map((service) => (
              <div 
                key={service.name}
                className="service-card"
                onClick={() => addToTotal(service.name, service.price)}
              >
                <div className="service-name">{service.name}</div>
                <div className="service-price">₹{service.price.toLocaleString()}</div>
              </div>
            ))}
          </div>

          {Object.keys(selectedServices).length > 0 && (
            <>
              <div className="selected-services">
                <h2>Selected Services</h2>
                {Object.entries(selectedServices).map(([service, quantity]) => {
                  const serviceObj = services.find(s => s.name === service);
                  return (
                    <div key={service} className="selected-service-item">
                      <div className="service-details">
                        <span>{service}</span>
                        <span>₹{serviceObj?.price.toLocaleString()} × {quantity}</span>
                      </div>
                      <button 
                        className="remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeService(service);
                        }}
                      >
                        −
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="client-info">
                <h2>Client Information</h2>
                <div className="form-group">
                  <label htmlFor="clientName">Contact Name</label>
                  <input 
                    type="text" 
                    id="clientName" 
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Enter contact name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="businessName">Business Name</label>
                  <input 
                    type="text" 
                    id="businessName" 
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Enter business name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="businessAddress">Business Address</label>
                  <textarea 
                    id="businessAddress" 
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    placeholder="Enter business address"
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phoneNumber">Phone Number</label>
                  <input 
                    type="tel" 
                    id="phoneNumber" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="clientEmail">Email</label>
                  <input 
                    type="email" 
                    id="clientEmail" 
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="discountPercent">Discount (%)</label>
                  <input 
                    type="number" 
                    id="discountPercent" 
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                    placeholder="Enter discount percentage"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            </>
          )}

          <div className="action-section">
            <div className="total-amount">
              Total: <span>₹{calculateTotal().toLocaleString()}</span>
            </div>
            {Object.keys(selectedServices).length > 0 && (
              <button 
                className="invoice-btn"
                onClick={generateInvoice}
                disabled={!clientName || !clientEmail}
              >
                Generate Invoice
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="invoice-container">
          <div className="invoice-actions">
            <button className="admin-btn" onClick={toggleAdminDashboard}>
              <BarChart size={16} /> Admin Dashboard
            </button>
            <button className="back-btn" onClick={closeInvoice} disabled={isPrinting}>
              <ArrowLeft size={16} /> Back to Calculator
            </button>
            <button className="cancel-btn" onClick={cancelInvoice} disabled={isPrinting}>
              <X size={16} /> Cancel Invoice
            </button>
            <button className="print-btn" onClick={printInvoice} disabled={isPrinting}>
              <Printer size={16} /> Print Invoice
            </button>
            <button className="download-btn" onClick={downloadInvoice} disabled={isPrinting}>
              <Download size={16} /> Download PDF
            </button>
          </div>
          
          <div className="invoice" ref={invoiceRef}>
            <div className="invoice-header">
              <div className="company-info">
                <h1>Cyber Tree</h1>
                <p>Digital Solutions Provider</p>
                <p>contact@cybertree.com</p>
                <p>+91 98765 43210</p>
              </div>
              <div className="invoice-title">
                <h2>INVOICE</h2>
                <div className="invoice-details">
                  <div className="detail-row">
                    <span className="detail-label">Invoice #:</span>
                    <span className="detail-value">{invoiceNumber}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">{invoiceDate}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Due Date:</span>
                    <span className="detail-value">{dueDate}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="invoice-client">
              <h3>Bill To:</h3>
              {businessName && <p className="client-business">{businessName}</p>}
              <p className="client-name">{clientName}</p>
              {businessAddress && <p className="client-address">{businessAddress}</p>}
              {phoneNumber && <p className="client-phone">{phoneNumber}</p>}
              <p className="client-email">{clientEmail}</p>
            </div>
            
            <div className="invoice-items">
              <table>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(selectedServices).map(([service, quantity]) => {
                    const serviceObj = services.find(s => s.name === service);
                    const price = serviceObj?.price || 0;
                    return (
                      <tr key={service}>
                        <td>{service}</td>
                        <td>{quantity}</td>
                        <td>₹{price.toLocaleString()}</td>
                        <td>₹{(price * quantity).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="invoice-summary">
              <div className="summary-row">
                <span className="summary-label">Subtotal:</span>
                <span className="summary-value">₹{calculateSubtotal().toLocaleString()}</span>
              </div>
              {discountPercent > 0 && (
                <div className="summary-row discount">
                  <span className="summary-label">Discount ({discountPercent}%):</span>
                  <span className="summary-value">-₹{calculateDiscount().toLocaleString()}</span>
                </div>
              )}
              <div className="summary-row">
                <span className="summary-label">GST (18%):</span>
                <span className="summary-value">₹{Math.round((calculateSubtotal() - calculateDiscount()) * 0.18).toLocaleString()}</span>
              </div>
              <div className="summary-row total">
                <span className="summary-label">Total:</span>
                <span className="summary-value">₹{calculateTotal().toLocaleString()}</span>
              </div>
            </div>
            
            <div className="invoice-footer">
              <p>Thank you for your business!</p>
              <p>Payment is due within 30 days. Please make payment to:</p>
              <p>Bank: HDFC Bank | Account: 12345678901234 | IFSC: HDFC0001234</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default App