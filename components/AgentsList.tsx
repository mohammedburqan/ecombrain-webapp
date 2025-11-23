'use client'

import { useState } from 'react'
import Link from 'next/link'
import CreateAgentModal from './CreateAgentModal'

interface Agent {
  id: string
  name: string
  type: string
  status: 'active' | 'inactive'
  created_at: string
}

interface AgentsListProps {
  agents: Agent[] | null
}

export default function AgentsList({ agents }: AgentsListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Agents</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#3194d1] text-white rounded-md hover:bg-[#267ab0] transition-colors"
          >
            Create Agent
          </button>
        </div>

        <div className="bg-[#1e2d5f] rounded-lg border border-[#2a3b75] shadow overflow-hidden">
          <table className="min-w-full divide-y divide-[#2a3b75]">
            <thead className="bg-[#152042]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-[#1e2d5f] divide-y divide-[#2a3b75]">
              {agents && agents.map((agent) => (
                <tr key={agent.id} className="hover:bg-[#2a3b75]/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/dashboard/agents/${agent.id}`}
                      className="text-sm font-medium text-[#3194d1] hover:text-[#267ab0]"
                    >
                      {agent.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                    {agent.type.replace(/_/g, ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      agent.status === 'active' ? 'bg-green-500/20 text-white border border-green-500/30' : 'bg-gray-500/20 text-white border border-gray-500/30'
                    }`}>
                      {agent.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                    {new Date(agent.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      href={`/dashboard/agents/${agent.id}`}
                      className="text-[#3194d1] hover:text-[#267ab0]"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {(!agents || agents.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-white/70">
                    No agents found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <CreateAgentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}

