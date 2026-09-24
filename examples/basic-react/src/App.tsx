import React from "react";
import { ProjectPreview } from "@thatg33k/seene/preview";

export default function App() {
  return (
    <ProjectPreview projectId="basic-demo" enabled={true} active={true}>
      <div className="p-12 max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-medium tracking-tight text-white">Basic React Consumer App</h1>
        <p className="text-neutral-400 text-sm leading-relaxed">
          This is an independent React application consuming Seene locally via workspace package dependencies without any public npm registry lookup.
        </p>
        <div className="p-8 rounded-2xl border border-neutral-800 bg-[#19191e] shadow-xl">
          <h2 className="text-lg font-medium text-white mb-2">Workspace Integration Test</h2>
          <p className="text-xs text-neutral-400">
            Rendering live UI components inside Seene&apos;s spatial cinematic presentation environment.
          </p>
        </div>
      </div>
    </ProjectPreview>
  );
}
