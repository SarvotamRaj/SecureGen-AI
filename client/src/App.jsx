import { useMemo, useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import ReactMarkdown from "react-markdown";
import "./App.css";

const API_URL = "http://localhost:5000/api/policies";

function Icon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" /><path d="m9 12 2 2 4-4" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a7.7 7.7 0 0 1-1.6.9l-.3 1.8h-2.8l-.3-1.8a7.7 7.7 0 0 1-1.6-.9l-1.7.6-1.4-2.4 1.4-1.1a7.2 7.2 0 0 1 0-1.9l-1.4-1.1 1.4-2.4 1.7.6a7.7 7.7 0 0 1 1.6-.9l.3-1.8h2.8l.3 1.8a7.7 7.7 0 0 1 1.6.9l1.7-.6 1.4 2.4-1.4 1.1a7.2 7.2 0 0 1 0 1.9z" /></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5M12 15V3" /></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    sparkle: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z" /><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8Z" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
  };

  return <svg {...common}>{paths[name] || paths.file}</svg>;
}

function App() {
  const [organization, setOrganization] = useState("");
  const [policyType, setPolicyType] = useState("Information Security Policy");
  const [requirements, setRequirements] = useState("");
  const [policy, setPolicy] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedPolicies, setSavedPolicies] = useState([]);
  const [editingPolicyId, setEditingPolicyId] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [showSavedPolicies, setShowSavedPolicies] = useState(false);
  const [fetchingPolicies, setFetchingPolicies] = useState(false);
  const [deletingPolicyId, setDeletingPolicyId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeView, setActiveView] = useState("generator");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function generatePolicy(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSaveMessage("");
    setPolicy("");
    setEditingPolicyId(null);

    try {
      const response = await axios.post(`${API_URL}/generate`, {
        organization,
        policyType,
        requirements,
      });
      setPolicy(response.data.policy || "");
      setActiveView("generator");
    } catch (err) {
      setError(err.response?.data?.message || "Policy generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function downloadPolicy() {
    if (!policy) return;
    const blob = new Blob([policy], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "security-policy.md";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadPolicyPDF() {
    if (!policy) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const maxWidth = pageWidth - margin * 2;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Security Policy", margin, 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    const metadataLines = doc.splitTextToSize(
      `Organization: ${organization}\nPolicy Type: ${policyType}`,
      maxWidth
    );
    doc.text(metadataLines, margin, 32);
    let y = 32 + metadataLines.length * 6 + 8;
    const lines = doc.splitTextToSize(policy, maxWidth);

    for (const line of lines) {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 6;
    }
    doc.save("security-policy.pdf");
  }

  async function fetchSavedPolicies() {
    setFetchingPolicies(true);
    setShowSavedPolicies(true);
    setError("");
    try {
      const response = await axios.get(`${API_URL}/saved`);
      setSavedPolicies(response.data.policies || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to fetch saved policies.");
    } finally {
      setFetchingPolicies(false);
    }
  }

  async function openLibrary() {
    setActiveView("library");
    setShowSavedPolicies(true);
    setSidebarOpen(false);
    await fetchSavedPolicies();
  }

  async function savePolicy() {
    if (!policy || saving) return;
    setSaving(true);
    setSaveMessage("");
    setError("");
    try {
      const response = await axios.post(`${API_URL}/save`, {
        organization,
        policyType,
        requirements,
        generatedPolicy: policy,
      });
      setSaveMessage(response.data.message || "Policy saved successfully!");
      if (showSavedPolicies || activeView === "library") {
        const savedResponse = await axios.get(`${API_URL}/saved`);
        setSavedPolicies(savedResponse.data.policies || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save the policy. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function updatePolicy() {
    if (!editingPolicyId || updating) return;
    setUpdating(true);
    setError("");
    setSaveMessage("");
    try {
      const response = await axios.put(`${API_URL}/saved/${editingPolicyId}`, {
        organization,
        policyType,
        requirements,
        generatedPolicy: policy,
      });
      setSaveMessage(response.data.message || "Policy updated successfully!");
      setEditingPolicyId(null);
      const savedResponse = await axios.get(`${API_URL}/saved`);
      setSavedPolicies(savedResponse.data.policies || []);
      setShowSavedPolicies(true);
      setActiveView("library");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update the policy. Please try again.");
    } finally {
      setUpdating(false);
    }
  }

  async function deletePolicy(id) {
    const confirmed = window.confirm("Are you sure you want to delete this saved policy?");
    if (!confirmed) return;
    setError("");
    setSaveMessage("");
    setDeletingPolicyId(id);
    try {
      await axios.delete(`${API_URL}/saved/${id}`);
      setSavedPolicies((previous) => previous.filter((item) => item._id !== id));
      if (editingPolicyId === id) cancelEdit();
      setSaveMessage("Policy deleted successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete the policy. Please try again.");
    } finally {
      setDeletingPolicyId("");
    }
  }

  async function copyPolicy() {
    if (!policy) return;
    try {
      await navigator.clipboard.writeText(policy);
      setSaveMessage("Policy copied to clipboard!");
      setError("");
    } catch {
      setError("Unable to copy policy. Please try again.");
    }
  }

  function viewSavedPolicy(item) {
    setPolicy(item.generatedPolicy || "");
    setOrganization(item.organization || "");
    setPolicyType(item.policyType || "Information Security Policy");
    setRequirements(item.requirements || "");
    setEditingPolicyId(item._id);
    setSaveMessage("");
    setError("");
    setShowSavedPolicies(false);
    setActiveView("generator");
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingPolicyId(null);
    setSaveMessage("");
    setError("");
  }

  const filteredPolicies = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return savedPolicies.filter((item) =>
      item.organization?.toLowerCase().includes(search) ||
      item.policyType?.toLowerCase().includes(search)
    );
  }, [savedPolicies, searchTerm]);

  function goToGenerator() {
    setActiveView("generator");
    setShowSavedPolicies(false);
    setSidebarOpen(false);
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <span className="brand-mark"><Icon name="shield" size={22} /></span>
          <span className="brand-name">SecureGen<span> AI</span></span>
          <button className="sidebar-close" type="button" onClick={() => setSidebarOpen(false)} aria-label="Close navigation">
            <Icon name="close" size={19} />
          </button>
        </div>

        <div className="sidebar-label">WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          <button className={`nav-item ${activeView === "generator" ? "active" : ""}`} type="button" onClick={goToGenerator}>
            <Icon name="sparkle" /> <span>Policy Generator</span>
          </button>
          <button className={`nav-item ${activeView === "library" ? "active" : ""}`} type="button" onClick={openLibrary}>
            <Icon name="file" /> <span>Policy Library</span>
            <span className="nav-count">{savedPolicies.length}</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help-icon"><Icon name="shield" size={19} /></div>
          <strong>Security first</strong>
          <p>AI-generated policies are drafts. Review them before adoption.</p>
          <div className="sidebar-version"><span className="online-dot" /> Local workspace</div>
        </div>
      </aside>

      {sidebarOpen && <button className="sidebar-backdrop" type="button" aria-label="Close navigation overlay" onClick={() => setSidebarOpen(false)} />}

      <div className="main-panel">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu" type="button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">
              <Icon name="menu" size={21} />
            </button>
            <div>
              <p className="topbar-kicker">SECUREGEN AI / WORKSPACE</p>
              <h2>{activeView === "library" ? "Policy Library" : editingPolicyId ? "Edit Security Policy" : "Policy Generator"}</h2>
            </div>
          </div>
          <div className="topbar-status"><span className="online-dot" /> AI workspace</div>
        </header>

        <main className="dashboard-content">
          <section className="welcome-banner">
            <div className="welcome-copy">
              <span className="welcome-eyebrow"><Icon name="sparkle" size={14} /> AI-POWERED POLICY WORKSPACE</span>
              <h1>{activeView === "library" ? "Your policy library." : "Security policies, made simpler."}</h1>
              <p>{activeView === "library"
                ? "Find, review, edit, and manage your organization's saved security policy drafts."
                : "Turn your organization's security requirements into structured policy drafts in minutes."}</p>
            </div>
            <div className="welcome-art" aria-hidden="true">
              <div className="art-orbit orbit-one" />
              <div className="art-orbit orbit-two" />
              <div className="art-shield"><Icon name="shield" size={43} /></div>
              <span className="art-sparkle sparkle-one">✦</span>
              <span className="art-sparkle sparkle-two">✧</span>
            </div>
          </section>

          <section className="summary-row" aria-label="Workspace summary">
            <article className="summary-card">
              <div className="summary-icon icon-purple"><Icon name="file" size={19} /></div>
              <div><span className="summary-label">Saved policies</span><strong>{savedPolicies.length}</strong><small>In your workspace</small></div>
            </article>
            <article className="summary-card">
              <div className="summary-icon icon-green"><Icon name="check" size={19} /></div>
              <div><span className="summary-label">Policy workflow</span><strong>Ready</strong><small>Generate · Review · Export</small></div>
            </article>
            <article className="summary-card">
              <div className="summary-icon icon-blue"><Icon name="shield" size={19} /></div>
              <div><span className="summary-label">Workspace status</span><strong>Active</strong><small>Local development mode</small></div>
            </article>
          </section>

          {activeView === "library" ? (
            <section className="library-panel">
              <div className="section-heading">
                <div>
                  <span className="section-eyebrow">YOUR DOCUMENTS</span>
                  <h2>Saved policies</h2>
                  <p>Search and manage your previously generated drafts.</p>
                </div>
                <button className="primary-button" type="button" onClick={goToGenerator}><Icon name="plus" size={17} /> Create policy</button>
              </div>

              {error && <div className="alert alert-error" role="alert">{error}</div>}
              {saveMessage && <div className="alert alert-success" role="status"><Icon name="check" size={16} />{saveMessage}</div>}

              <div className="library-toolbar">
                <label className="search-field">
                  <Icon name="search" size={18} />
                  <input
                    type="search"
                    aria-label="Search saved policies"
                    placeholder="Search organization or policy type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </label>
                <span className="result-count">{filteredPolicies.length} {filteredPolicies.length === 1 ? "policy" : "policies"}</span>
              </div>

              {fetchingPolicies ? (
                <div className="library-empty"><span className="loading-spinner" /><h3>Loading policies...</h3><p>Fetching your saved policy drafts.</p></div>
              ) : filteredPolicies.length === 0 ? (
                <div className="library-empty">
                  <div className="empty-illustration"><Icon name="file" size={29} /></div>
                  <h3>{searchTerm ? "No matching policies" : "Your library is empty"}</h3>
                  <p>{searchTerm ? "Try another organization name or policy type." : "Generate and save a policy to see it here."}</p>
                  {searchTerm && <button className="secondary-button" type="button" onClick={() => setSearchTerm("")}>Clear search</button>}
                </div>
              ) : (
                <div className="library-grid">
                  {filteredPolicies.map((item) => (
                    <article className="library-card" key={item._id}>
                      <div className="library-card-top">
                        <span className="document-icon"><Icon name="file" size={20} /></span>
                        <span className="document-badge">Policy draft</span>
                      </div>
                      <h3>{item.organization || "Unnamed organization"}</h3>
                      <p className="library-policy-type">{item.policyType || "Security policy"}</p>
                      <p className="library-date">Saved {item.createdAt ? new Date(item.createdAt).toLocaleString() : "Date unavailable"}</p>
                      <div className="library-card-actions">
                        <button className="primary-button small-button" type="button" onClick={() => viewSavedPolicy(item)}><Icon name="edit" size={15} /> Edit / View</button>
                        <button className="danger-button small-button" type="button" onClick={() => deletePolicy(item._id)} disabled={deletingPolicyId === item._id}>
                          <Icon name="trash" size={15} /> {deletingPolicyId === item._id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ) : (
            <section className="workspace-grid">
              <form className="panel form-panel" onSubmit={generatePolicy}>
                <div className="panel-heading">
                  <div className="panel-heading-icon"><Icon name="settings" size={19} /></div>
                  <div><h2>Policy configuration</h2><p>Tell the AI what your organization needs.</p></div>
                </div>

                <label htmlFor="organization">Organization name <span className="required-mark">*</span></label>
                <input
                  id="organization"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g. ABC Technologies"
                  required
                />

                <label htmlFor="policyType">Policy type <span className="required-mark">*</span></label>
                <select id="policyType" value={policyType} onChange={(e) => setPolicyType(e.target.value)}>
                  <option>Information Security Policy</option>
                  <option>Data Protection Policy</option>
                  <option>Password Policy</option>
                  <option>Access Control Policy</option>
                  <option>Incident Response Policy</option>
                  <option>Acceptable Use Policy</option>
                </select>

                <div className="label-row">
                  <label htmlFor="requirements">Security requirements <span className="required-mark">*</span></label>
                  <span className="field-hint">Be specific</span>
                </div>
                <textarea
                  id="requirements"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Describe security needs, risks, controls, and compliance requirements..."
                  rows={6}
                  required
                />
                <div className="form-footnote"><Icon name="shield" size={14} /> Avoid entering passwords or confidential personal data.</div>

                <button className="primary-button generate-button" type="submit" disabled={loading}>
                  {loading ? <><span className="button-spinner" /> Generating policy...</> : <><Icon name="sparkle" size={17} /> Generate security policy</>}
                </button>
                {error && <div className="alert alert-error" role="alert">{error}</div>}
              </form>

              <section className="panel result-panel">
                <div className="panel-heading result-heading">
                  <div className="panel-heading-icon result-icon"><Icon name="file" size={19} /></div>
                  <div><h2>{editingPolicyId ? "Edit policy draft" : "Generated policy"}</h2><p>{policy ? "Review the content before saving or exporting." : "Your generated document will appear here."}</p></div>
                  {policy && <span className="draft-badge">Draft</span>}
                </div>

                {loading ? (
                  <div className="result-empty loading-state"><span className="loading-spinner" /><h3>Drafting your policy</h3><p>The AI is organizing your requirements into a structured security policy.</p></div>
                ) : policy ? (
                  <>
                    <div className="document-meta">
                      <div><span>ORGANIZATION</span><strong>{organization || "Not specified"}</strong></div>
                      <div><span>POLICY TYPE</span><strong>{policyType}</strong></div>
                    </div>
                    <article className="policy-content">
                      <ReactMarkdown>{policy}</ReactMarkdown>
                    </article>
                    <div className="policy-actions">
                      <button className="secondary-button" type="button" onClick={copyPolicy}><Icon name="copy" size={16} /> Copy</button>
                      <button className="secondary-button" type="button" onClick={downloadPolicy}><Icon name="download" size={16} /> Markdown</button>
                      <button className="secondary-button" type="button" onClick={downloadPolicyPDF}><Icon name="download" size={16} /> PDF</button>
                      {editingPolicyId ? (
                        <>
                          <button className="primary-button" type="button" onClick={updatePolicy} disabled={updating}>{updating ? "Updating..." : <><Icon name="check" size={16} /> Update policy</>}</button>
                          <button className="plain-button" type="button" onClick={cancelEdit} disabled={updating}>Cancel edit</button>
                        </>
                      ) : (
                        <button className="primary-button" type="button" onClick={savePolicy} disabled={saving}>{saving ? "Saving..." : <><Icon name="plus" size={16} /> Save policy</>}</button>
                      )}
                    </div>
                    {saveMessage && <div className="alert alert-success" role="status"><Icon name="check" size={16} />{saveMessage}</div>}
                  </>
                ) : (
                  <div className="result-empty">
                    <div className="empty-illustration"><Icon name="shield" size={30} /></div>
                    <span className="result-overline">READY WHEN YOU ARE</span>
                    <h3>Your policy starts here</h3>
                    <p>Complete the configuration and generate a draft. You can then review, edit, save, copy, or download it.</p>
                    <div className="empty-feature-row">
                      <span><Icon name="check" size={14} /> Structured sections</span>
                      <span><Icon name="check" size={14} /> Export-ready</span>
                    </div>
                  </div>
                )}
              </section>
            </section>
          )}

          <footer className="app-footer">
            <span>SecureGen AI</span><span>AI-generated policies are drafts and require human review before adoption.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default App;
