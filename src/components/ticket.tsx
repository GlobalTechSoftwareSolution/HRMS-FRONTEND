"use client";

import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Calendar, User, AlertCircle, CheckCircle, Clock, X, Mail, Users, MessageCircle } from 'lucide-react';

export interface Ticket {
  id: string;
  subject: string;
  title?: string;
  description: string;
  status: 'open' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  email: string;
  created_at: string;
  updated_at: string;
  assigned_to?: string | null;
  assigned_by?: string | null;
  closed_by?: string | null;
  closed_to?: string | null;
  closed_description?: string | null;
}

interface TicketProps {
  email?: string;
  statusFilter?: string;
  priorityFilter?: string;
  showCreateButton?: boolean;
}

const Ticket: React.FC<TicketProps> = ({
  email,
  statusFilter,
  priorityFilter,
  showCreateButton = true,
}) => {
  const [tickets, setTickets] = useState<{
    assignedToMe: Ticket[];
    raisedByMe: Ticket[];
    closedByMe: Ticket[];
    allTickets: Ticket[];
  }>({ assignedToMe: [], raisedByMe: [], closedByMe: [], allTickets: [] });

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editFields, setEditFields] = useState<{ 
    status: Ticket['status']; 
    closed_description: string;
    showClosureInput: boolean;
  }>({ 
    status: 'open', 
    closed_description: '',
    showClosureInput: false 
  });

  const openModal = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setEditFields({ 
      status: ticket.status, 
      closed_description: ticket.closed_description || '',
      showClosureInput: false 
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTicket(null);
    setEditFields({ status: 'open', closed_description: '', showClosureInput: false });
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: statusFilter || '', priority: priorityFilter || '', email: email || '' });
  const [showFilters, setShowFilters] = useState(false);
  const [activeSection, setActiveSection] = useState<'all' | 'assigned' | 'raised' | 'closed'>('all');

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    try {
      const userEmail = (localStorage.getItem('user_email') || '').toLowerCase();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/tickets/`);
      if (!response.ok) throw new Error('Failed to fetch tickets');
      const data = await response.json();

      interface TicketFromAPI {
        id: string;
        subject: string;
        description: string;
        status: string;
        priority: string;
        email: string;
        assigned_by?: string | null;
        assigned_to?: string | null;
        closed_by?: string | null;
        closed_to?: string | null;
        closed_description?: string | null;
        created_at: string;
        updated_at: string;
      }

      const normalizeStatus = (status: string) => status.toLowerCase().replace(' ', '-');
      const filteredData: Ticket[] = data.map((ticket: TicketFromAPI) => ({
        ...ticket,
        status: normalizeStatus(ticket.status),
        priority: ticket.priority.toLowerCase(),
        title: ticket.subject,
      }));

      // Filter tickets to only those related to the current user (case-insensitive)
      const userRelatedTickets = filteredData.filter(t =>
        [t.assigned_by, t.assigned_to, t.closed_by, t.closed_to]
          .some(e => e?.toLowerCase() === userEmail)
      );

      setTickets({
        assignedToMe: userRelatedTickets.filter(t => t.assigned_to?.toLowerCase() === userEmail),
        raisedByMe: userRelatedTickets.filter(t => t.assigned_by?.toLowerCase() === userEmail),
        closedByMe: userRelatedTickets.filter(t => t.closed_by?.toLowerCase() === userEmail),
        allTickets: userRelatedTickets,
      });
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets({ assignedToMe: [], raisedByMe: [], closedByMe: [], allTickets: [] });
    }
  };

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [createFields, setCreateFields] = useState({ subject: '', description: '', priority: 'medium', assigned_to: '' });
  const [creating, setCreating] = useState(false);

  const openCreateModal = () => {
    setCreateFields({ subject: '', description: '', priority: 'medium', assigned_to: '' });
    setShowCreateModal(true);
  };
  const closeCreateModal = () => setShowCreateModal(false);
  const handleCreateFieldChange = (field: string, value: string) => setCreateFields(prev => ({ ...prev, [field]: value }));

  const submitCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const userEmail = localStorage.getItem('user_email') || '';
      const payload = {
        assigned_by: userEmail,
        assigned_to: createFields.assigned_to || null,
        subject: createFields.subject,
        description: createFields.description,
        status: 'Open',
        priority: createFields.priority.charAt(0).toUpperCase() + createFields.priority.slice(1),
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/tickets/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create ticket: ${errorText}`);
      }

      await response.json();
      fetchTickets();
      setShowCreateModal(false);
      setCreateFields({ subject: '', description: '', priority: 'medium', assigned_to: '' });
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Failed to create ticket. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: Ticket['status'], closedDescription?: string) => {
    try {
      const userEmail = (localStorage.getItem('user_email') || '').toLowerCase();
      
      // Find the selected ticket in state
      const ticket = tickets.allTickets.find(t => t.id === ticketId);
      if (!ticket) {
        setDialogMessage('Ticket not found.');
        setShowDialog(true);
        return;
      }

      // Validation logic
      if (newStatus === 'closed' && ticket.assigned_to?.toLowerCase() !== userEmail) {
        setDialogMessage('Only the assigned user can close this ticket.');
        setShowDialog(true);
        return;
      }
      if (newStatus === 'open' && ticket.assigned_by?.toLowerCase() !== userEmail) {
        setDialogMessage('Only the person who assigned this ticket can reopen it.');
        setShowDialog(true);
        return;
      }

      const patchPayload: Partial<Pick<Ticket, 'status' | 'closed_description' | 'closed_by' | 'closed_to'>> = { 
        status: newStatus
      };

      if (newStatus === 'closed') {
        patchPayload.closed_description = closedDescription || '';
        patchPayload.closed_by = userEmail;
        patchPayload.closed_to = ticket.assigned_by || '';
      } else {
        // Reopening clears closure info
        patchPayload.closed_by = null;
        patchPayload.closed_to = null;
        patchPayload.closed_description = null;
      }

      const patchUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/tickets/${ticketId}/`;

      const response = await fetch(patchUrl, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(patchPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update ticket: ${errorText}`);
      }
      await response.json();

      // Update local state instantly
      setTickets(prev => {
        const allUpdated = prev.allTickets.map(t =>
          t.id === ticketId ? { ...t, status: newStatus } : t
        );

        let assignedUpdated = prev.assignedToMe;
        let closedUpdated = prev.closedByMe;

        if (newStatus === 'closed') {
          assignedUpdated = assignedUpdated.filter(t => t.id !== ticketId);
          closedUpdated = [...closedUpdated, { ...ticket, status: 'closed' }];
        } else if (newStatus === 'open') {
          closedUpdated = closedUpdated.filter(t => t.id !== ticketId);
          assignedUpdated = [...assignedUpdated, { ...ticket, status: 'open' }];
        }

        return {
          ...prev,
          allTickets: allUpdated,
          assignedToMe: assignedUpdated,
          closedByMe: closedUpdated,
        };
      });

      setDialogMessage(
        newStatus === 'closed'
          ? '✅ Ticket closed successfully!'
          : '♻️ Ticket reopened successfully!'
      );
      setShowDialog(true);
      closeModal();
    } catch (error) {
      console.error('Error updating ticket:', error);
      setDialogMessage('Failed to update ticket. Please try again.');
      setShowDialog(true);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'closed': return <CheckCircle className="w-4 h-4 text-gray-500" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const styles = { 
      low: 'bg-green-100 text-green-800 border border-green-200', 
      medium: 'bg-yellow-100 text-yellow-800 border border-yellow-200', 
      high: 'bg-orange-100 text-orange-800 border border-orange-200', 
      urgent: 'bg-red-100 text-red-800 border border-red-200' 
    };
    return <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[priority as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
      {priority.toUpperCase()}
    </span>;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      open: 'bg-red-50 text-red-700 border border-red-200',
      closed: 'bg-gray-50 text-gray-700 border border-gray-200'
    };
    return <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
      {status.replace('-', ' ')}
    </span>;
  };

  const clearFilters = () => { setFilters({ status: '', priority: '', email: '' }); setSearchTerm(''); };

  // Filtering logic
  const filterTickets = (tickets: Ticket[]) =>
    tickets.filter(ticket => {
      const matchesSearch =
        !searchTerm ||
        (ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus =
        !filters.status || ticket.status.toLowerCase() === filters.status.toLowerCase();
      const matchesPriority =
        !filters.priority || ticket.priority.toLowerCase() === filters.priority.toLowerCase();
      const matchesEmail =
        !filters.email || ticket.email.toLowerCase().includes(filters.email.toLowerCase());
      return matchesSearch && matchesStatus && matchesPriority && matchesEmail;
    });

  // Get tickets for current active section
  const getCurrentTickets = () => {
    switch (activeSection) {
      case 'assigned': return filterTickets(tickets.assignedToMe);
      case 'raised': return filterTickets(tickets.raisedByMe);
      case 'closed': return filterTickets(tickets.closedByMe);
      default: return filterTickets(tickets.allTickets);
    }
  };

  // Stats for dashboard
  const stats = {
    total: tickets.allTickets.length,
    assigned: tickets.assignedToMe.length,
    raised: tickets.raisedByMe.length,
    closed: tickets.closedByMe.filter(t => t.status === 'closed').length,
    open: tickets.allTickets.filter(t => t.status === 'open').length,
  };

  // Enhanced TicketCard component
  const TicketCard = ({ ticket }: { ticket: Ticket }) => (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 p-6 cursor-pointer hover:border-blue-300"
      onClick={() => openModal(ticket)}
    >
      <div className="flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">{ticket.subject}</h3>
            <p className="text-gray-600 text-sm line-clamp-2">{ticket.description}</p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {getStatusIcon(ticket.status)}
            {getStatusBadge(ticket.status)}
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span className="font-medium">Raised by:</span>
            <span>{ticket.assigned_by || ticket.email}</span>
          </div>
          {ticket.assigned_to && (
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span className="font-medium">Assigned to:</span>
              <span>{ticket.assigned_to}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-3">
            {getPriorityBadge(ticket.priority)}
            {ticket.closed_description && (
              <div className="flex items-center gap-1 text-xs text-gray-500" title={ticket.closed_description}>
                <MessageCircle className="w-3 h-3" />
                <span>Closure note added</span>
              </div>
            )}
          </div>
          <button 
            className="px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
            onClick={(e) => {
              e.stopPropagation();
              openModal(ticket);
            }}
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 text-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Support Tickets</h1>
            <p className="text-gray-600 text-lg">Manage and track all your support requests</p>
          </div>
          {showCreateButton && (
            <button 
              onClick={openCreateModal} 
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" /> 
              Create New Ticket
            </button>
          )}
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                <p className="text-2xl font-bold text-red-600">{stats.open}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assigned to Me</p>
                <p className="text-2xl font-bold text-orange-600">{stats.assigned}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <User className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search tickets by subject or description..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              <Filter className="w-5 h-5" /> 
              Filters
              {(filters.status || filters.priority || filters.email) && (
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center">
                  {[filters.status, filters.priority, filters.email].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>
          
          {showFilters && (
            <div className="mt-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select 
                    value={filters.status} 
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="">All Status</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select 
                    value={filters.priority} 
                    onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="">All Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input 
                    type="email" 
                    value={filters.email} 
                    onChange={(e) => setFilters(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Filter by email..." 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>
              {(filters.status || filters.priority || filters.email || searchTerm) && (
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={clearFilters} 
                    className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2 transition-colors"
                  >
                    <X className="w-4 h-4" /> 
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveSection('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeSection === 'all' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All Tickets ({tickets.allTickets.length})
            </button>
            <button
              onClick={() => setActiveSection('assigned')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeSection === 'assigned' 
                  ? 'bg-orange-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Assigned to Me ({tickets.assignedToMe.length})
            </button>
            <button
              onClick={() => setActiveSection('raised')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeSection === 'raised' 
                  ? 'bg-green-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Raised by Me ({tickets.raisedByMe.length})
            </button>
            <button
              onClick={() => setActiveSection('closed')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeSection === 'closed' 
                  ? 'bg-gray-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Closed by Me ({tickets.closedByMe.length})
            </button>
          </div>
        </div>

        {/* Tickets Grid */}
        <div className="grid gap-6">
          {getCurrentTickets().length > 0 ? (
            getCurrentTickets().map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))
          ) : (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No tickets found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search criteria or create a new ticket</p>
              {showCreateButton && (
                <button 
                  onClick={openCreateModal}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Your First Ticket
                </button>
              )}
            </div>
          )}
        </div>

        {/* View Details Modal */}
        {showModal && selectedTicket && (() => {
          const userEmail = localStorage.getItem('user_email') || '';
          const isAssignedUser = selectedTicket.assigned_to?.toLowerCase() === userEmail.toLowerCase();
          const isTicketCreator = selectedTicket.assigned_by?.toLowerCase() === userEmail.toLowerCase();
          
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">{selectedTicket.subject}</h2>
                    <button 
                      className="text-gray-500 hover:text-gray-700 transition-colors" 
                      onClick={closeModal}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedTicket.description}</p>
                  </div>

                  {/* Closure Description */}
                  {selectedTicket.closed_description && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Closure Notes</h3>
                      <p className="text-gray-700 bg-green-50 p-4 rounded-lg border border-green-200">
                        {selectedTicket.closed_description}
                      </p>
                    </div>
                  )}

                  {/* Ticket Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(selectedTicket.status)}
                        {getStatusBadge(selectedTicket.status)}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Priority</h3>
                      {getPriorityBadge(selectedTicket.priority)}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Raised By</h3>
                      <p className="text-gray-900">{selectedTicket.assigned_by || selectedTicket.email}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Assigned To</h3>
                      <p className="text-gray-900">{selectedTicket.assigned_to || 'Unassigned'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Created</h3>
                      <p className="text-gray-900">{new Date(selectedTicket.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Last Updated</h3>
                      <p className="text-gray-900">{new Date(selectedTicket.updated_at).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Status Update (for assigned users or creators) */}
                  {(isAssignedUser || isTicketCreator) && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h3>
                      
                      {/* Status Selector */}
                      <div className="mb-4">
                        <select
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 mb-3"
                          value={editFields.status}
                          onChange={(e) => {
                            const newStatus = e.target.value as Ticket['status'];
                            setEditFields(prev => ({ 
                              ...prev, 
                              status: newStatus,
                              showClosureInput: newStatus === 'closed'
                            }));
                          }}
                        >
                          <option value="open">Open</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>

                      {/* Closure Description Input */}
                      {editFields.showClosureInput && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Closure Description *
                          </label>
                          <textarea
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                            placeholder="Please provide details about how this ticket was resolved or why it's being closed..."
                            value={editFields.closed_description}
                            onChange={(e) => setEditFields(prev => ({ 
                              ...prev, 
                              closed_description: e.target.value 
                            }))}
                            required
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            This description will be visible to the ticket creator and other team members.
                          </p>
                        </div>
                      )}

                      {/* Update Button */}
                      <button
                        onClick={() => {
                          if (editFields.status === 'closed' && !editFields.closed_description.trim()) {
                            setDialogMessage('Please provide a closure description before closing the ticket.');
                            setShowDialog(true);
                            return;
                          }
                          updateTicketStatus(
                            selectedTicket.id, 
                            editFields.status, 
                            editFields.closed_description
                          );
                        }}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Update Ticket Status
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                  <div className="flex justify-end gap-3">
                    <button 
                      type="button" 
                      className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      onClick={closeModal}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Create Ticket Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Create New Ticket</h2>
                  <button 
                    className="text-gray-500 hover:text-gray-700 transition-colors" 
                    onClick={closeCreateModal}
                    disabled={creating}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <form onSubmit={submitCreateTicket} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 transition-all"
                    value={createFields.subject} 
                    onChange={e => handleCreateFieldChange('subject', e.target.value)} 
                    required 
                    placeholder="Brief subject of your issue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 transition-all min-h-[120px]"
                    value={createFields.description} 
                    onChange={e => handleCreateFieldChange('description', e.target.value)} 
                    required 
                    placeholder="Detailed description of the issue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 transition-all"
                    value={createFields.priority} 
                    onChange={e => handleCreateFieldChange('priority', e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assign To (Optional)</label>
                  <input 
                    type="email" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 transition-all"
                    value={createFields.assigned_to} 
                    onChange={e => handleCreateFieldChange('assigned_to', e.target.value)} 
                    placeholder="Email address of assignee"
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    type="button" 
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    onClick={closeCreateModal}
                    disabled={creating}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={creating}
                  >
                    {creating ? 'Creating...' : 'Create Ticket'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Dialog Modal */}
        {showDialog && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notice</h3>
              <p className="text-gray-700 mb-6">{dialogMessage}</p>
              <button
                onClick={() => setShowDialog(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ticket;