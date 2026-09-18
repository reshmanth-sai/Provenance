"use client";

import React, { useState } from "react";
import { Terminal, Copy, Check, Code, Shield, Key, Network } from "lucide-react";

const SPEC_TABS = [
  {
    id: "json-ld",
    name: "W3C Credential Schema",
    icon: Code,
    content: `{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://provenance.network/schemas/v2/academic.jsonld"
  ],
  "id": "urn:uuid:7f3b891e-4c02-4e9b-9801-b5e1c0d48f92",
  "type": ["VerifiableCredential", "AcademicDegreeCredential"],
  "issuer": {
    "id": "did:provenance:inst_mit_4419",
    "name": "Massachusetts Institute of Technology",
    "publicKey": "0x04f82a9...d3c10a"
  },
  "issuanceDate": "2024-06-05T14:30:00Z",
  "credentialSubject": {
    "id": "did:provenance:cand_88a91c0e",
    "degree": "Master of Science",
    "field": "Computer Science & AI",
    "honors": "Summa Cum Laude"
  },
  "proof": {
    "type": "EcdsaSecp256r1Signature2019",
    "created": "2024-06-05T14:30:01Z",
    "verificationMethod": "did:provenance:inst_mit_4419#key-1",
    "jws": "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...k9a2Z"
  }
}`,
  },
  {
    id: "merkle",
    name: "Merkle Proof Vector",
    icon: Network,
    content: `{
  "leafHash": "0xa4f89d81e3a6c2f901b74c5d8e9f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f",
  "leafIndex": 412,
  "treeSize": 1024,
  "merkleRoot": "0x77b899cc55dd44ee33ff22aa1100bb99887766554433221100ffeeddccbbaa99",
  "auditPath": [
    "0x3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9fa4f89d81e3a6c2f901b74c5d8e9f2a",
    "0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e",
    "0x0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b"
  ],
  "verificationStatus": "MATHEMATICALLY_AUTHENTIC"
}`,
  },
  {
    id: "block",
    name: "Ledger Block Header",
    icon: Shield,
    content: `{
  "blockHeight": 412,
  "timestamp": 1717597801,
  "parentHash": "0xf2c4e6a8d0b2c4e6a8d0b2c4e6a8d0b2c4e6a8d0b2c4e6a8d0b2c4e6a8d0b2c4",
  "contentDigest": "0xa4f89d81e3a6c2f901b74c5d8e9f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f",
  "authorityId": "org_mit_institutional_ledger",
  "concurrencyLock": "pg_advisory_xact_lock(hash_chain_issuer_key)",
  "ecdsaSignature": {
    "r": "0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456",
    "s": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
  }
}`,
  },
  {
    id: "curl",
    name: "Programmatic cURL",
    icon: Terminal,
    content: `# Verify any credential digest directly via the live production API:
curl -X GET "https://provenance-api-izcd.onrender.com/verify/mit-cs-2024" \\
  -H "Accept: application/json"

# Direct health & database consensus check:
curl "https://provenance-api-izcd.onrender.com/health"
# Response: {"status":"ok","db":"connected"}`,
  },
];

export default function ProtocolInspector() {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SPEC_TABS[activeTab].content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="protocol-lab" className="py-24 px-4 sm:px-6 lg:px-8 border-b border-white/10 bg-obsidian">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 hairline-b pb-8">
          <div className="space-y-3 max-w-2xl">
            <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-semibold flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-phosphor" />
              <span>TRANSPARENT OPEN SPECIFICATION</span>
            </span>
            <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
              Protocol Specification Lab.
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              No proprietary vendor lock-in. Every cryptographic claim, Merkle inclusion proof, 
              and append-only block header can be validated independently with standard RFC algorithms.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500">FORMAT: RFC-7515 / W3C-VC</span>
          </div>
        </div>

        {/* Terminal Window */}
        <div className="rounded-2xl bg-obsidian-card border border-white/10 overflow-hidden shadow-2xl backdrop-blur-xl">
          {/* Tab Navigation */}
          <div className="px-4 pt-3 bg-obsidian-elevated/80 border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
              {SPEC_TABS.map((tab, idx) => {
                const Icon = tab.icon;
                const isActive = activeTab === idx;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(idx)}
                    data-cursor="INSPECT"
                    className={`px-3.5 py-2 rounded-lg text-xs font-mono flex items-center gap-2 transition-colors ${
                      isActive
                        ? "bg-white/10 text-white font-semibold border border-white/15"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleCopy}
              data-cursor="COPY"
              className="mb-2 sm:mb-0 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/10 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors border border-white/10"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-phosphor" />
                  <span className="text-phosphor">Copied Payload</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Payload</span>
                </>
              )}
            </button>
          </div>

          {/* Code Viewer */}
          <div className="p-6 bg-obsidian-surface/90 overflow-x-auto">
            <pre className="font-mono text-xs text-emerald-400/90 leading-relaxed selection:bg-phosphor selection:text-obsidian">
              <code>{SPEC_TABS[activeTab].content}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
