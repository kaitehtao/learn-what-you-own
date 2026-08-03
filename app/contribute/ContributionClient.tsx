"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { authenticatedFetch, getSupabaseBrowserClient, loginPath } from "../supabase-browser";

const contributionTypes = ["Factual correction","Thesis update","Industry observation","External dataset observation","Competitive analysis","Financial model","Earnings model","Research report","Question for management","Supplier / customer relationship","Upcoming IPO dossier","Private company dossier"];
const companyProposalTypes = ["Upcoming IPO dossier", "Private company dossier"];
type Submission = { id:number; ticker:string; contributionType:string; claim:string; status:string; moderationNote:string; createdAt:string };
type ResearchAssetUpload = { type:string; title:string; storagePath:string; fileName:string; mimeType:string; fileSize:number };

const emptyForm = {
  ticker: "ONDS",
  contributionType: contributionTypes[0],
  claim: "",
  whyItMatters: "",
  sourceUrl: "",
  evidenceDate: "",
  confidence: "High — direct primary evidence",
  timeHorizon: "Current fact",
  expertise: "",
  positionDisclosure: "",
  conflictDisclosure: "",
  relatedCompany: "",
  relatedTicker: "",
  relationshipDirection: "supplier_to_company",
  relationshipProduct: "",
  relationshipMateriality: "unknown",
  relationshipEvidenceClass: "direct_disclosure",
  relationshipSourceType: "sec",
  proposedCompanyName: "",
  proposedTicker: "",
  proposedExchange: "",
  expectedIpoDate: "",
  companyWebsite: "",
  roadshowTitle: "",
  roadshowSourceUrl: "",
  researchAssetTitle: "",
  googleSheetUrl: "",
  collaborationNotes: "",
};

export function ContributionClient({ initialTicker, initialType, initialDraft }: { initialTicker?: string; initialType?: string; initialDraft?: { claim?: string; whyItMatters?: string; sourceUrl?: string } }) {
  const [form, setForm] = useState({ ...emptyForm, ticker: initialTicker || emptyForm.ticker, contributionType: contributionTypes.includes(initialType ?? "") ? initialType! : emptyForm.contributionType, claim: initialDraft?.claim ?? "", whyItMatters: initialDraft?.whyItMatters ?? "", sourceUrl: initialDraft?.sourceUrl ?? "" });
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [username, setUsername] = useState("your username");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [roadshowFile, setRoadshowFile] = useState<File | null>(null);
  const [roadshowInputKey, setRoadshowInputKey] = useState(0);
  const [researchFile, setResearchFile] = useState<File | null>(null);
  const [researchInputKey, setResearchInputKey] = useState(0);

  const load = useCallback(async () => {
    const response = await authenticatedFetch("/api/contributions");
    if (response.ok) {
      const data = await response.json() as { contributions: Submission[] };
      setSubmissions(data.contributions);
    }
  }, []);
  useEffect(() => {
    let active = true;
    Promise.all([authenticatedFetch("/api/contributions"), authenticatedFetch("/api/account")]).then(async ([response, accountResponse]) => {
      if (!active) return;
      if (response.status === 401 || accountResponse.status === 401) {
        window.location.href = loginPath(`${window.location.pathname}${window.location.search}`);
        return;
      }
      if (!response.ok) return;
      const data = await response.json() as { contributions: Submission[] };
      if (active) setSubmissions(data.contributions);
      if (accountResponse.ok) {
        const account = await accountResponse.json() as { profile?: { username?: string; onboarding_complete?: boolean } };
        if (!account.profile?.onboarding_complete) window.location.href = "/onboarding";
        else if (account.profile.username) setUsername(account.profile.username);
      }
    });
    return () => { active = false; };
  }, [initialTicker]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    let uploadedPath = "";
    let researchAsset: ResearchAssetUpload | null = null;
    if (roadshowFile && form.contributionType === "Upcoming IPO dossier") {
      if (roadshowFile.type !== "application/pdf" || roadshowFile.size > 20 * 1024 * 1024) {
        setError("Roadshow uploads must be PDF files no larger than 20 MB.");
        setBusy(false);
        return;
      }
      const supabase = await getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = loginPath(window.location.pathname);
        return;
      }
      const safeName = roadshowFile.name.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+/, "").slice(-120) || "roadshow.pdf";
      uploadedPath = `${user.id}/${Date.now()}-${safeName.toLowerCase().endsWith(".pdf") ? safeName : `${safeName}.pdf`}`;
      const { error: uploadError } = await supabase.storage.from("roadshow-materials").upload(uploadedPath, roadshowFile, { contentType: "application/pdf", upsert: false });
      if (uploadError) {
        setError(uploadError.message || "Unable to upload the roadshow PDF.");
        setBusy(false);
        return;
      }
    }
    const supportsResearchAsset = ["Financial model", "Earnings model", "Research report"].includes(form.contributionType);
    if (researchFile && supportsResearchAsset) {
      const expectedType = form.contributionType === "Research report" ? "research_report" : "earnings_model";
      const formData = new FormData();
      formData.set("assetType", expectedType);
      formData.set("file", researchFile);
      const uploadResponse = await authenticatedFetch("/api/contributions/assets", { method: "POST", body: formData });
      const uploadData = await uploadResponse.json() as { asset?: ResearchAssetUpload; error?: string };
      if (!uploadResponse.ok || !uploadData.asset) {
        if (uploadedPath) {
          const supabase = await getSupabaseBrowserClient();
          await supabase.storage.from("roadshow-materials").remove([uploadedPath]);
        }
        setError(uploadData.error ?? "Unable to upload the research file.");
        setBusy(false);
        return;
      }
      researchAsset = uploadData.asset;
    }
    const payload = {
      ...form,
      roadshowStoragePath: uploadedPath,
      researchAssetType: researchAsset?.type ?? "",
      researchAssetTitle: form.researchAssetTitle.trim() || researchAsset?.title || "",
      researchAssetStoragePath: researchAsset?.storagePath ?? "",
      researchAssetFileName: researchAsset?.fileName ?? "",
      researchAssetMimeType: researchAsset?.mimeType ?? "",
      researchAssetFileSize: researchAsset?.fileSize ?? 0,
    };
    const response = await authenticatedFetch("/api/contributions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json() as { error?: string };
    if (!response.ok) {
      if (uploadedPath) {
        const supabase = await getSupabaseBrowserClient();
        await supabase.storage.from("roadshow-materials").remove([uploadedPath]);
      }
      if (researchAsset?.storagePath) {
        await authenticatedFetch("/api/contributions/assets", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ storagePath: researchAsset.storagePath }) });
      }
      setError(data.error ?? "Unable to submit your contribution.");
      setBusy(false);
      return;
    }
    setSubmitted(true);
    setForm({...emptyForm, ticker: form.ticker, contributionType: form.contributionType});
    setRoadshowFile(null);
    setRoadshowInputKey((value) => value + 1);
    setResearchFile(null);
    setResearchInputKey((value) => value + 1);
    await load();
    setBusy(false);
  }

  const isCompanyProposal = companyProposalTypes.includes(form.contributionType);
  const isIpoProposal = form.contributionType === "Upcoming IPO dossier";
  const isResearchAssetContribution = ["Financial model", "Earnings model", "Research report"].includes(form.contributionType);
  const isResearchReport = form.contributionType === "Research report";
  const isEarningsModel = form.contributionType === "Earnings model";

  return <section className="container contribute-layout">
    <aside><span className="kicker">CONTRIBUTION TYPES</span>{contributionTypes.map((item,index)=><button type="button" className={form.contributionType===item?"active":""} onClick={()=>setForm({...form,contributionType:item})} key={item}><span>{String(index+1).padStart(2,"0")}</span>{item}</button>)}<div className="contributor-standard"><strong>Submitting as @{username}</strong><p>Be specific. Cite primary evidence. Separate fact from interpretation. Disclose your position and conflicts.</p></div></aside>
    <article>
      {submitted&&<div className="submission-banner">✓ Submitted for editorial review. It will remain unpublished until an editor approves it.</div>}
      <form onSubmit={submit}>
        <div className="form-heading"><span>New contribution</span><em>Editorial review required</em></div>
        <div className="form-grid">{!isCompanyProposal&&<label>COMPANY TICKER<input required value={form.ticker} onChange={(e)=>setForm({...form,ticker:e.target.value.toUpperCase()})} placeholder="ONDS"/></label>}<label>CONTRIBUTION TYPE<select value={form.contributionType} onChange={(e)=>setForm({...form,contributionType:e.target.value})}>{contributionTypes.map(item=><option key={item}>{item}</option>)}</select></label></div>
        {isCompanyProposal&&<div className="company-proposal-fields">
          <div className="relationship-form-intro"><strong>{isIpoProposal?"Propose an upcoming IPO dossier":"Propose an approved private-company dossier"}</strong><p>The company remains unpublished until an editor verifies its identity, primary source, disclosures, and any uploaded roadshow document.</p></div>
          <div className="form-grid"><label>COMPANY NAME<input required value={form.proposedCompanyName} onChange={(e)=>setForm({...form,proposedCompanyName:e.target.value})} placeholder="Full legal or operating name"/></label><label>{isIpoProposal?"PROPOSED TICKER · OPTIONAL":"KNOWN TICKER OR IDENTIFIER · OPTIONAL"}<input value={form.proposedTicker} onChange={(e)=>setForm({...form,proposedTicker:e.target.value.toUpperCase()})} placeholder="May be left blank"/></label><label>EXCHANGE · OPTIONAL<input value={form.proposedExchange} onChange={(e)=>setForm({...form,proposedExchange:e.target.value})} placeholder="NYSE, Nasdaq, or expected venue"/></label>{isIpoProposal&&<label>EXPECTED IPO DATE<input required type="date" value={form.expectedIpoDate} onChange={(e)=>setForm({...form,expectedIpoDate:e.target.value})}/></label>}</div>
          <label>OFFICIAL COMPANY WEBSITE<input required type="url" value={form.companyWebsite} onChange={(e)=>setForm({...form,companyWebsite:e.target.value})} placeholder="https://company.com"/></label>
          {isIpoProposal&&<div className="roadshow-upload"><div><strong>Roadshow materials</strong><p>Upload an official PDF or link to an issuer/SEC-hosted roadshow. Files stay private until the dossier is approved.</p></div><label>ROADSHOW TITLE<input value={form.roadshowTitle} onChange={(e)=>setForm({...form,roadshowTitle:e.target.value})} placeholder="Investor roadshow presentation"/></label><label>UPLOAD PDF · MAX 20 MB<input key={roadshowInputKey} type="file" accept="application/pdf,.pdf" onChange={(e)=>setRoadshowFile(e.target.files?.[0]??null)}/></label><label>OFFICIAL ROADSHOW URL · OPTIONAL<input type="url" value={form.roadshowSourceUrl} onChange={(e)=>setForm({...form,roadshowSourceUrl:e.target.value})} placeholder="https://www.sec.gov/Archives/..."/></label></div>}
        </div>}
        <label>{isCompanyProposal?"DOSSIER SUMMARY":"MAIN CLAIM OR CORRECTION"}<textarea required minLength={20} value={form.claim} onChange={(e)=>setForm({...form,claim:e.target.value})} placeholder={isCompanyProposal?"Describe the business, products, customers, funding or offering status, and what is directly verified.":"State one specific, verifiable claim."} /></label>
        <label>WHY IT MATTERS<textarea required minLength={20} value={form.whyItMatters} onChange={(e)=>setForm({...form,whyItMatters:e.target.value})} placeholder={isCompanyProposal?"Explain why this company belongs in the research universe and what an investor should monitor.":"Explain how this evidence changes—or does not change—the owner’s understanding."} /></label>
        {isResearchAssetContribution&&<div className="research-asset-upload">
          <div><strong>{isResearchReport?"Publish a sourced research report":"Share an earnings model"}</strong><p>{isResearchReport?"Upload a PDF for editorial review. The file remains private until approved.":"Upload XLSX/CSV, embed a Google Sheet, or provide both. Approved worksheets can be reviewed and collectively maintained by the community."}</p></div>
          <label>PUBLIC TITLE<input required={isResearchReport||isEarningsModel||Boolean(form.googleSheetUrl)||Boolean(researchFile)} value={form.researchAssetTitle} onChange={(e)=>setForm({...form,researchAssetTitle:e.target.value})} placeholder={isResearchReport?"FCEL operating review — August 2026":"FCEL quarterly earnings model"}/></label>
          <label>{isResearchReport?"UPLOAD PDF · MAX 20 MB":"UPLOAD XLSX OR CSV · MAX 20 MB"}<input key={researchInputKey} required={isResearchReport||(isEarningsModel&&!form.googleSheetUrl)} type="file" accept={isResearchReport?"application/pdf,.pdf":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,.xlsx,.csv"} onChange={(e)=>setResearchFile(e.target.files?.[0]??null)}/></label>
          {!isResearchReport&&<label>GOOGLE SHEET URL · OPTIONAL<input type="url" value={form.googleSheetUrl} onChange={(e)=>setForm({...form,googleSheetUrl:e.target.value})} placeholder="https://docs.google.com/spreadsheets/d/…/edit"/><small>Set sharing permissions in Google first. The website never receives your Google credentials.</small></label>}
          {!isResearchReport&&<label>COLLABORATION NOTES<textarea value={form.collaborationNotes} onChange={(e)=>setForm({...form,collaborationNotes:e.target.value})} placeholder="Describe editable tabs, assumptions, version conventions, and how contributors should propose changes."/></label>}
          {!isResearchReport&&<div className="sheet-sharing-note"><strong>Community editing is controlled by Google.</strong><p>Use Google’s Share settings to choose view, comment, or edit access. Editors will verify the sheet and sharing level before publication.</p></div>}
        </div>}
        {form.contributionType === "Supplier / customer relationship" && <div className="relationship-contribution-fields">
          <div className="relationship-form-intro"><strong>Describe one directional business relationship</strong><p>A relationship becomes a public graph connection only after an editor confirms it in an SEC filing or official company source.</p></div>
          <div className="form-grid"><label>RELATED ORGANIZATION<input required value={form.relatedCompany} onChange={(e)=>setForm({...form,relatedCompany:e.target.value})} placeholder="Full legal or commonly disclosed name" /></label><label>RELATED PUBLIC TICKER · OPTIONAL<input value={form.relatedTicker} onChange={(e)=>setForm({...form,relatedTicker:e.target.value.toUpperCase()})} placeholder="Leave blank if private" /></label></div>
          <label>RELATIONSHIP DIRECTION<select value={form.relationshipDirection} onChange={(e)=>setForm({...form,relationshipDirection:e.target.value})}><option value="supplier_to_company">The related organization supplies {form.ticker || "this company"}</option><option value="company_to_customer">{form.ticker || "This company"} supplies the related customer</option></select></label>
          <label>PRODUCT OR SERVICE SUPPLIED<input required value={form.relationshipProduct} onChange={(e)=>setForm({...form,relationshipProduct:e.target.value})} placeholder="e.g. advanced packaging, cloud capacity, autonomous drone systems" /></label>
          <div className="form-grid"><label>DISCLOSURE SIGNIFICANCE<select value={form.relationshipMateriality} onChange={(e)=>setForm({...form,relationshipMateriality:e.target.value})}><option value="unknown">Named relationship</option><option value="material">Material to reported results</option><option value="strategic">Described as strategic</option></select></label><label>EVIDENCE STRENGTH<select value={form.relationshipEvidenceClass} onChange={(e)=>setForm({...form,relationshipEvidenceClass:e.target.value})}><option value="direct_disclosure">Direct filing/company disclosure</option><option value="corroborated">Corroborated by both companies</option><option value="inferred">Supported inference—not directly named</option></select></label><label>PRIMARY SOURCE CLASS<select value={form.relationshipSourceType} onChange={(e)=>setForm({...form,relationshipSourceType:e.target.value})}><option value="sec">SEC filing</option><option value="company">Official company / investor relations</option></select></label></div>
        </div>}
        <div className="form-grid"><label>{isCompanyProposal?"CITE PRIMARY COMPANY OR SEC SOURCE":"CITE SOURCE OF SUBMITTED INFORMATION"}<input required type="url" value={form.sourceUrl} onChange={(e)=>setForm({...form,sourceUrl:e.target.value})} placeholder={isCompanyProposal?"Official website, Form S-1, press release, or company filing":"Paste the SEC filing, company release, or other evidence URL"} /></label><label>DATE OF EVIDENCE<input required type="date" value={form.evidenceDate} onChange={(e)=>setForm({...form,evidenceDate:e.target.value})}/></label><label>CONFIDENCE<select value={form.confidence} onChange={(e)=>setForm({...form,confidence:e.target.value})}><option>High — direct primary evidence</option><option>Medium — supported inference</option><option>Low — question for review</option></select></label><label>TIME HORIZON<select value={form.timeHorizon} onChange={(e)=>setForm({...form,timeHorizon:e.target.value})}><option>Current fact</option><option>Next 12 months</option><option>Long term</option></select></label></div>
        <label>RELEVANT EXPERTISE<input value={form.expertise} onChange={(e)=>setForm({...form,expertise:e.target.value})} placeholder="e.g. Rail communications engineer, independent investor" /></label>
        <div className="form-grid"><label>POSITION DISCLOSURE<input required value={form.positionDisclosure} onChange={(e)=>setForm({...form,positionDisclosure:e.target.value})} placeholder="e.g. Long shares; no position"/></label><label>OTHER CONFLICTS<input value={form.conflictDisclosure} onChange={(e)=>setForm({...form,conflictDisclosure:e.target.value})} placeholder="Employment, compensation, relationships, or none"/></label></div>
        {error&&<p className="form-error">{error}</p>}
        <div className="disclosure-box"><p>Submitting does not publish your research. Editors may approve, reject, or request revisions, and every approved contribution retains its source and disclosure record.</p></div>
        <button className="submit-contribution" disabled={busy}>{busy?"Submitting…":"Submit for editorial review →"}</button>
      </form>
      <div className="my-submissions"><div className="form-heading"><span>My submission history</span><em>{submissions.length} total</em></div>{submissions.length===0?<p>No submissions yet.</p>:submissions.map((item)=><div className="submission-row" key={item.id}><i>{item.ticker}</i><span><strong>{item.contributionType}</strong><p>{item.claim}</p>{item.moderationNote&&<small>Editor note: {item.moderationNote}</small>}</span><em className={`status-${item.status}`}>{item.status.replace("_"," ")}</em></div>)}</div>
    </article>
  </section>;
}
