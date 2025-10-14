"use client";

import React, { useState } from 'react';
import { Search, Filter, Plus, Calendar, User, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  email: string;
  createdAt: string;
  updatedAt: string;
  assignee?: string;
}

interface TicketProps {
  tickets?: Ticket[];
  email?: string;
  statusFilter?: string;
  priorityFilter?: string;
  showCreateButton?: boolean;
  onCreateTicket?: () => void;
}

const Ticket: React.FC<TicketProps> = ({
  tickets = defaultTickets,
  email,
  statusFilter,
  priorityFilter,
  showCreateButton = true,
  onCreateTicket
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: statusFilter || '',
    priority: priorityFilter || '',
    email: email || ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Filter tickets based on search term and filters
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch =
      !searchTerm ||
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      !filters.status || ticket.status.toLowerCase() === filters.status.toLowerCase();

    const matchesPriority =
      !filters.priority || ticket.priority.toLowerCase() === filters.priority.toLowerCase();

    const matchesEmail =
      !filters.email || ticket.email.toLowerCase().includes(filters.email.toLowerCase());

    return matchesSearch && matchesStatus && matchesPriority && matchesEmail;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'in-progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed': return <CheckCircle className="w-4 h-4 text-gray-500" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[priority as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {priority}
      </span>
    );
  };

  const clearFilters = () => {
    setFilters({ status: '', priority: '', email: '' });
    setSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 text-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tickets</h1>
              <p className="text-gray-600 mt-2">Manage and track tickets</p>
            </div>
            {showCreateButton && (
              <button
                onClick={onCreateTicket}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Ticket
              </button>
            )}
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Filter className="w-5 h-5" />
              Filters
              {(filters.status || filters.priority || filters.email) && (
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {[filters.status, filters.priority, filters.email].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {/* Email Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={filters.email}
                    onChange={(e) => setFilters(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Filter by email..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              {(filters.status || filters.priority || filters.email || searchTerm) && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tickets Grid */}
        <div className="grid gap-6">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{ticket.title}</h3>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        <span className="text-sm font-medium capitalize text-gray-700">
                          {ticket.status.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4 line-clamp-2">{ticket.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{ticket.email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div>
                        {getPriorityBadge(ticket.priority)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex sm:flex-col gap-2">
                    <button className="px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                      View Details
                    </button>
                    <button className="px-4 py-2 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                      Assign
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-gray-900">{tickets.length}</div>
            <div className="text-gray-600">Total Tickets</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-red-600">
              {tickets.filter(t => t.status === 'open').length}
            </div>
            <div className="text-gray-600">Open</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">
              {tickets.filter(t => t.status === 'in-progress').length}
            </div>
            <div className="text-gray-600">In Progress</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">
              {tickets.filter(t => t.status === 'resolved').length}
            </div>
            <div className="text-gray-600">Resolved</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Default sample data
const defaultTickets: Ticket[] = [
  {
    id: '1',
    title: 'Login issue',
    description: 'Unable to login to the dashboard, getting authentication error.',
    status: 'open',
    priority: 'high',
    email: 'user1@example.com',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    title: 'Payment failure',
    description: 'Payment transaction is failing at the last step with error code 500.',
    status: 'in-progress',
    priority: 'urgent',
    email: 'user2@example.com',
    createdAt: '2024-01-14T15:30:00Z',
    updatedAt: '2024-01-15T09:00:00Z',
    assignee: 'Support Agent 1'
  },
  {
    id: '3',
    title: 'Feature request',
    description: 'Would like to request dark mode for the mobile application.',
    status: 'open',
    priority: 'low',
    email: 'user3@example.com',
    createdAt: '2024-01-13T11:20:00Z',
    updatedAt: '2024-01-13T11:20:00Z'
  },
  {
    id: '4',
    title: 'Bug report',
    description: 'The calendar widget is not displaying events properly on Safari browser.',
    status: 'resolved',
    priority: 'medium',
    email: 'user1@example.com',
    createdAt: '2024-01-12T14:15:00Z',
    updatedAt: '2024-01-15T08:45:00Z',
    assignee: 'Dev Team'
  }
];

export default Ticket;