import React, { useState } from "react";
import { PhilHealthClaim, ClaimStatus, HospitalConfig } from "../types";
import {
  CreditCard,
  Search,
  Filter,
  Printer,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Send,
  X,
  ExternalLink,
} from "../components/Icons";

interface PhilHealthClaimsViewProps {
  claims: PhilHealthClaim[];
  onUpdateClaims: (updated: PhilHealthClaim[]) => void;
  hospitalConfig: HospitalConfig;
}

export default function PhilHealthClaimsView({
  claims,
  onUpdateClaims,
  hospitalConfig,
}: PhilHealthClaimsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedClaim, setSelectedClaim] = useState<PhilHealthClaim | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [isNewClaimModalOpen, setIsNewClaimModalOpen] = useState(false);

  // New claim form state
  const [newPin, setNewPin] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMembershipType, setNewMembershipType] = useState("Formal Economy / Private");
  const [newDiagnosis, setNewDiagnosis] = useState("");
  const [newCaseRate, setNewCaseRate] = useState("Php 6,000 - Medical Case");
  const [newHospitalCharges, setNewHospitalCharges] = useState(12500);
  const [newBenefit, setNewBenefit] = useState(6000);

  // Filtered claims
  const filteredClaims = claims.filter(claim => {
    const matchesSearch =
      claim.pin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.diagnosisWithIcd.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "All" || claim.claimStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Financial calculations
  const totalClaimsCount = claims.length;
  const readyClaimsCount = claims.filter(c => c.claimStatus === "Ready for Submission").length;
  const approvedClaimsCount = claims.filter(c => c.claimStatus === "Approved / Reimbursed").length;
  const totalReimbursedAmount = claims.reduce((acc, c) => acc + c.philhealthBenefit, 0);

  const getStatusBadge = (status: ClaimStatus) => {
    switch (status) {
      case "Ready for Submission":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock size={12} strokeWidth={2} />
            Ready for Submission
          </span>
        );
      case "Transmitted":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Send size={12} strokeWidth={2} />
            Transmitted
          </span>
        );
      case "Under Adjudication":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Clock size={12} strokeWidth={2} />
            Under Adjudication
          </span>
        );
      case "Approved / Reimbursed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle size={12} strokeWidth={2} />
            Approved / Reimbursed
          </span>
        );
      case "Returned / Pending Docs":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle size={12} strokeWidth={2} />
            Returned / Pending Docs
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const handleStatusChange = (claimId: string, newStatus: ClaimStatus) => {
    const updated = claims.map(c => (c.id === claimId ? { ...c, claimStatus: newStatus } : c));
    onUpdateClaims(updated);
  };

  const handleCreateClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin || !newMemberName || !newDiagnosis) return;

    const newClaim: PhilHealthClaim = {
      id: `CLM-2026-00${claims.length + 1}`,
      patientId: `P-2024-00${claims.length + 1}`,
      pin: newPin,
      memberName: newMemberName,
      membershipType: newMembershipType,
      diagnosisWithIcd: newDiagnosis,
      caseRateAmount: newCaseRate,
      claimStatus: "Ready for Submission",
      submissionDate: new Date().toISOString().split("T")[0],
      hospitalCharges: newHospitalCharges,
      philhealthBenefit: newBenefit,
      patientPayable: Math.max(0, newHospitalCharges - newBenefit),
    };

    onUpdateClaims([newClaim, ...claims]);
    setIsNewClaimModalOpen(false);
    setNewPin("");
    setNewMemberName("");
    setNewDiagnosis("");
  };

  return (
    <div className="space-y-5">
      {/* Top Banner / Metrics */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
                <CreditCard size={20} strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">
                  PhilHealth & eClaims Management
                </h2>
                <p className="text-xs text-slate-500">
                  Universal Health Care (RA 11223) & Electronic Hospital Claims Portal
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNewClaimModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus size={15} strokeWidth={2} />
              <span>Create New eClaim</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
              Total eClaims
            </div>
            <div className="text-xl font-bold text-slate-800 mt-0.5">{totalClaimsCount}</div>
            <div className="text-[10px] text-slate-400 mt-1">Hospital outpatient census</div>
          </div>

          <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-3">
            <div className="text-[11px] font-medium text-blue-700 uppercase tracking-wide">
              Ready for Submission
            </div>
            <div className="text-xl font-bold text-blue-900 mt-0.5">{readyClaimsCount}</div>
            <div className="text-[10px] text-blue-600 mt-1">Pending XML batch upload</div>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-100 rounded-lg p-3">
            <div className="text-[11px] font-medium text-emerald-700 uppercase tracking-wide">
              Approved & Settled
            </div>
            <div className="text-xl font-bold text-emerald-900 mt-0.5">{approvedClaimsCount}</div>
            <div className="text-[10px] text-emerald-600 mt-1">Direct deposit credited</div>
          </div>

          <div className="bg-teal-50/60 border border-teal-100 rounded-lg p-3">
            <div className="text-[11px] font-medium text-teal-700 uppercase tracking-wide">
              Total Case Rate Value
            </div>
            <div className="text-xl font-bold text-teal-900 mt-0.5 font-mono">
              ₱{totalReimbursedAmount.toLocaleString()}
            </div>
            <div className="text-[10px] text-teal-600 mt-1">PhilHealth benefit covered</div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Controls Bar: Search & Status Filter */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search
              size={15}
              strokeWidth={2}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search by PIN (12-xxxx), Member Name, or ICD-10..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Filter size={14} strokeWidth={2} className="text-slate-400" />
              <span>Status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-teal-500"
            >
              <option value="All">All Statuses</option>
              <option value="Ready for Submission">Ready for Submission</option>
              <option value="Transmitted">Transmitted</option>
              <option value="Under Adjudication">Under Adjudication</option>
              <option value="Approved / Reimbursed">Approved / Reimbursed</option>
              <option value="Returned / Pending Docs">Returned / Pending Docs</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">PIN</th>
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Type of Membership</th>
                <th className="py-3 px-4">Admission Diagnosis</th>
                <th className="py-3 px-4">PhilHealth Case Rate</th>
                <th className="py-3 px-4">Claim Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                    No PhilHealth claims match your criteria.
                  </td>
                </tr>
              ) : (
                filteredClaims.map(claim => (
                  <tr
                    key={claim.id}
                    className="hover:bg-teal-50/40 transition-colors group"
                  >
                    {/* PIN */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 whitespace-nowrap">
                      {claim.pin}
                    </td>

                    {/* Member Name */}
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {claim.memberName}
                      <span className="block text-[10px] text-slate-500">
                        Ref: {claim.id} • {claim.patientId}
                      </span>
                    </td>

                    {/* Type of Membership */}
                    <td className="py-3.5 px-4 text-slate-700">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                        {claim.membershipType}
                      </span>
                    </td>

                    {/* Admission Diagnosis */}
                    <td className="py-3.5 px-4 text-slate-800 max-w-xs font-medium">
                      {claim.diagnosisWithIcd}
                    </td>

                    {/* PhilHealth Case Rate */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-teal-800">
                        {claim.caseRateAmount}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Hosp: ₱{claim.hospitalCharges.toLocaleString()} • Copay: ₱{claim.patientPayable.toLocaleString()}
                      </div>
                    </td>

                    {/* Claim Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(claim.claimStatus)}
                        <select
                          value={claim.claimStatus}
                          onChange={e => handleStatusChange(claim.id, e.target.value as ClaimStatus)}
                          className="text-[11px] py-0.5 px-1 bg-white border border-slate-200 rounded text-slate-600 focus:outline-hidden hover:border-slate-300"
                          title="Change claim status"
                        >
                          <option value="Ready for Submission">Ready for Submission</option>
                          <option value="Transmitted">Transmitted</option>
                          <option value="Under Adjudication">Under Adjudication</option>
                          <option value="Approved / Reimbursed">Approved / Reimbursed</option>
                          <option value="Returned / Pending Docs">Returned / Pending Docs</option>
                        </select>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedClaim(claim);
                            setIsStatementModalOpen(true);
                          }}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 text-[11px] font-medium transition-colors border border-slate-200 inline-flex items-center gap-1"
                          title="View Itemized Billing Statement"
                        >
                          <FileText size={13} strokeWidth={2} />
                          <span>Statement</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedClaim(claim);
                            setIsReceiptModalOpen(true);
                          }}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 text-[11px] font-medium transition-colors border border-slate-200 inline-flex items-center gap-1"
                          title="Print Patient Official Receipt"
                        >
                          <Printer size={13} strokeWidth={2} />
                          <span>Receipt</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info note */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Showing <span className="font-semibold text-slate-700">{filteredClaims.length}</span> of {claims.length} claims registered in OPD PhilHealth ledger
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>PhilHealth eClaims API Gateway: Connected (Status: Operational)</span>
          </div>
        </div>
      </div>

      {/* Itemized Billing Statement Modal */}
      {isStatementModalOpen && selectedClaim && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  CC
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Itemized Billing Statement (PhilHealth CF-2)
                  </h3>
                  <p className="text-xs text-slate-500">
                    {hospitalConfig.name} • Claim Ref #{selectedClaim.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsStatementModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {/* Patient & PhilHealth Info Header */}
            <div className="bg-slate-50 rounded-lg p-3 grid grid-cols-2 gap-2 text-xs border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px]">MEMBER / PATIENT</span>
                <span className="font-semibold text-slate-800">{selectedClaim.memberName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">PHILHEALTH PIN</span>
                <span className="font-mono font-semibold text-teal-800">{selectedClaim.pin}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">MEMBERSHIP TYPE</span>
                <span className="text-slate-700">{selectedClaim.membershipType}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">ADMISSION DIAGNOSIS</span>
                <span className="text-slate-700 font-medium">{selectedClaim.diagnosisWithIcd}</span>
              </div>
            </div>

            {/* Financial Breakdown Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <div className="bg-slate-100 px-3 py-2 font-semibold text-slate-700 border-b border-slate-200">
                Itemized Charges & Benefit Breakdown
              </div>
              <div className="divide-y divide-slate-100">
                <div className="flex justify-between px-3 py-2 text-slate-600">
                  <span>Hospital Facility & Room Charges</span>
                  <span className="font-mono">₱{(selectedClaim.hospitalCharges * 0.45).toFixed(2)}</span>
                </div>
                <div className="flex justify-between px-3 py-2 text-slate-600">
                  <span>Medicines & Pharmacy Charges</span>
                  <span className="font-mono">₱{(selectedClaim.hospitalCharges * 0.35).toFixed(2)}</span>
                </div>
                <div className="flex justify-between px-3 py-2 text-slate-600">
                  <span>Diagnostic / Laboratory Services</span>
                  <span className="font-mono">₱{(selectedClaim.hospitalCharges * 0.20).toFixed(2)}</span>
                </div>
                <div className="flex justify-between px-3 py-2 font-semibold text-slate-800 bg-slate-50">
                  <span>Total Actual Hospital Charges</span>
                  <span className="font-mono">₱{selectedClaim.hospitalCharges.toLocaleString()}</span>
                </div>
                <div className="flex justify-between px-3 py-2 font-semibold text-teal-700 bg-teal-50">
                  <span>Less: PhilHealth Case Rate Benefit ({selectedClaim.caseRateAmount})</span>
                  <span className="font-mono">- ₱{selectedClaim.philhealthBenefit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between px-3 py-2.5 font-bold text-slate-900 bg-slate-100 text-sm">
                  <span>Patient Out-of-Pocket Copay</span>
                  <span className="font-mono text-rose-700">₱{selectedClaim.patientPayable.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs"
              >
                <Printer size={14} strokeWidth={2} />
                <span>Print Official Statement</span>
              </button>
              <button
                onClick={() => setIsStatementModalOpen(false)}
                className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Patient Official Receipt Modal */}
      {isReceiptModalOpen && selectedClaim && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Official Patient Billing Receipt
                </h3>
                <p className="text-xs text-slate-500">OPD Cashier & Claims Clearance</p>
              </div>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50/60 space-y-3 text-xs">
              <div className="text-center pb-2 border-b border-slate-200">
                <div className="font-bold text-slate-900 text-sm">{hospitalConfig.name}</div>
                <div className="text-[10px] text-slate-500">{hospitalConfig.address}</div>
                <div className="text-[10px] text-slate-500">VAT Reg. TIN: 004-982-110-000</div>
              </div>

              <div className="space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>OR Number:</span>
                  <span className="font-mono font-semibold text-slate-800">OR-2026-{selectedClaim.id.replace("CLM-", "")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{new Date().toLocaleDateString("en-PH")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Patient / Member:</span>
                  <span className="font-semibold text-slate-800">{selectedClaim.memberName}</span>
                </div>
                <div className="flex justify-between">
                  <span>PhilHealth PIN:</span>
                  <span className="font-mono">{selectedClaim.pin}</span>
                </div>
              </div>

              <div className="border-t border-b border-slate-200 py-2 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Hospital Fee:</span>
                  <span className="font-mono">₱{selectedClaim.hospitalCharges.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-teal-700 font-medium">
                  <span>PhilHealth Deductions:</span>
                  <span className="font-mono">- ₱{selectedClaim.philhealthBenefit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 text-sm pt-1">
                  <span>Net Amount Paid:</span>
                  <span className="font-mono text-teal-800">₱{selectedClaim.patientPayable.toLocaleString()}</span>
                </div>
              </div>

              <div className="text-[10px] text-center text-slate-400 italic">
                Thank you for choosing {hospitalConfig.name}. This serves as your official patient receipt.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs"
              >
                <Printer size={14} strokeWidth={2} />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Claim Modal Form */}
      {isNewClaimModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 rounded-lg text-teal-700">
                  <CreditCard size={18} strokeWidth={2} />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Encode New PhilHealth eClaim
                </h3>
              </div>
              <button
                onClick={() => setIsNewClaimModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleCreateClaim} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  PhilHealth Identification Number (PIN) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 12-345678901-2"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  PhilHealth Member Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Dela Cruz, Juan Santos"
                  value={newMemberName}
                  onChange={e => setNewMemberName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Membership Type
                  </label>
                  <select
                    value={newMembershipType}
                    onChange={e => setNewMembershipType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:border-teal-500"
                  >
                    <option value="Formal Economy / Private">Formal Economy / Private</option>
                    <option value="Direct Contributor - Government">Direct Contributor - Government</option>
                    <option value="Direct Contributor - Self-Employed">Direct Contributor - Self-Employed</option>
                    <option value="Senior Citizen (RA 10645)">Senior Citizen (RA 10645)</option>
                    <option value="Indirect Contributor - Indigent">Indirect Contributor - Indigent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    PhilHealth Case Rate Package
                  </label>
                  <select
                    value={newCaseRate}
                    onChange={e => {
                      setNewCaseRate(e.target.value);
                      if (e.target.value.includes("6,000")) setNewBenefit(6000);
                      else if (e.target.value.includes("9,000")) setNewBenefit(9000);
                      else if (e.target.value.includes("15,000")) setNewBenefit(15000);
                      else if (e.target.value.includes("24,000")) setNewBenefit(24000);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:border-teal-500"
                  >
                    <option value="Php 6,000 - Medical Case">Php 6,000 - Medical Case</option>
                    <option value="Php 9,000 - Konsulta / OPD Package">Php 9,000 - Konsulta / OPD Package</option>
                    <option value="Php 15,000 - Moderate Medical">Php 15,000 - Moderate Medical</option>
                    <option value="Php 24,000 - Surgical Package">Php 24,000 - Surgical Package</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Admission Diagnosis & ICD-10 Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acute Gastroenteritis - ICD-10: A09"
                  value={newDiagnosis}
                  onChange={e => setNewDiagnosis(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Total Hospital Charges (₱)
                  </label>
                  <input
                    type="number"
                    value={newHospitalCharges}
                    onChange={e => setNewHospitalCharges(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    PhilHealth Benefit Deduction (₱)
                  </label>
                  <input
                    type="number"
                    value={newBenefit}
                    onChange={e => setNewBenefit(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="bg-teal-50 rounded-lg p-3 text-xs flex items-center justify-between text-teal-800">
                <span>Calculated Patient Out-of-Pocket Balance:</span>
                <span className="font-bold font-mono text-sm">
                  ₱{Math.max(0, newHospitalCharges - newBenefit).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewClaimModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs"
                >
                  Save & Validate Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
