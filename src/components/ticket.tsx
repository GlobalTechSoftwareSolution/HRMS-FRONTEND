"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Search, Filter, Plus, Calendar, User, AlertCircle, CheckCircle, Clock, X, Mail, Users, MessageCircle } from 'lucide-react';

// Helper function to format dates as DD/MM/YYYY or DD/MM/YYYY HH:MM
function formatDate(dateString: string, withTime: boolean = false): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  if (withTime) {
    let hours = date.getHours();
    const minutes = pad(date.getMinutes());
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should become 12
    const hourStr = pad(hours);
    return `${day}/${month}/${year} ${hourStr}:${minutes} ${ampm}`;
  }
  return `${day}/${month}/${year}`;
}

export interface Ticket {
  id: string;
  subject: string;
  title?: string;
  description: string;
  status: 'open' | 'closed' | 'in-progress';
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

  const submitCreateTicket = async () => {
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
      if (newStatus === 'in-progress' && ticket.assigned_to?.toLowerCase() !== userEmail) {
        setDialogMessage('Only the assigned user can mark this ticket as In Progress.');
        setShowDialog(true);
        return;
      }
      if (newStatus === 'open' && ticket.assigned_by?.toLowerCase() !== userEmail) {
        setDialogMessage('Only the person who assigned this ticket can reopen it.');
        setShowDialog(true);
        return;
      }

      // Map frontend status to backend format
      const apiStatus =
        newStatus === 'closed'
          ? 'Closed'
          : newStatus === 'open'
          ? 'Open'
          : newStatus === 'in-progress'
          ? 'In Progress'
          : newStatus;

      const patchPayload: Partial<Pick<Ticket, 'status' | 'closed_description' | 'closed_by' | 'closed_to'>> = { 
        status: apiStatus as Ticket['status']
      };

      if (newStatus === 'closed' || newStatus === 'in-progress') {
        patchPayload.closed_description = closedDescription || '';
        patchPayload.closed_by = userEmail;
        patchPayload.closed_to = ticket.assigned_by || '';
      } else {
        // For Open — remove closure fields entirely
        delete patchPayload.closed_by;
        delete patchPayload.closed_to;
        delete patchPayload.closed_description;
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
          : '♻️ Ticket submitted successfully!'
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
      closed: 'bg-green-50 text-green-700 border border-green-200',
      'in-progress': 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
          styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status.replace('-', ' ')}
      </span>
    );
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
  const TicketCard = ({ ticket }: { ticket: Ticket }) => {
    // For closed or in-progress, show closed date (updated_at as proxy)
    const showClosed =
      ticket.status === 'closed' || ticket.status === 'in-progress';
    return (
      <div 
        className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 p-4 sm:p-6 cursor-pointer hover:border-blue-300"
        onClick={() => openModal(ticket)}
      >
        <div className="flex flex-col space-y-3 sm:space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 line-clamp-1">{ticket.subject}</h3>
              <p className="text-gray-600 text-sm line-clamp-2">{ticket.description}</p>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              {getStatusIcon(ticket.status)}
              {getStatusBadge(ticket.status)}
            </div>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="font-medium">Raised by:</span>
              <span className="break-words max-w-[150px] sm:max-w-[200px]">{ticket.assigned_by || ticket.email}</span>
            </div>
            {ticket.assigned_to && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="font-medium">Assigned to:</span>
                <span className="break-words max-w-[150px] sm:max-w-[200px]">{ticket.assigned_to}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Created: {formatDate(ticket.created_at, true)}</span>
            </div>
            {showClosed && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>
                  Closed: {formatDate(ticket.updated_at, true)}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 border-t border-gray-100 gap-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {getPriorityBadge(ticket.priority)}
              {ticket.closed_description && (
                <div className="flex items-center gap-1 text-xs text-gray-500" title={ticket.closed_description}>
                  <MessageCircle className="w-3 h-3" />
                  <span className="hidden sm:inline">Closure note added</span>
                  <span className="sm:hidden">Note</span>
                </div>
              )}
            </div>
            <button 
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium w-full sm:w-auto"
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 text-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Tickets</h1>
            <p className="text-gray-600 text-base sm:text-lg">Manage and track all your tickets</p>
          </div>
          {showCreateButton && (
            <button 
              onClick={openCreateModal} 
              className="bg-blue-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> 
              <span className="text-sm sm:text-base">Create New Ticket</span>
            </button>
          )}
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Tickets</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-50 rounded-lg">
                <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Open Tickets</p>
                <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.open}</p>
              </div>
              <div className="p-2 sm:p-3 bg-red-50 rounded-lg">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{tickets.allTickets.filter(t => t.status === 'in-progress').length}</p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-50 rounded-lg">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Assigned to Me</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-600">{stats.assigned}</p>
              </div>
              <div className="p-2 sm:p-3 bg-orange-50 rounded-lg">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input 
                type="text" 
                placeholder="Search tickets by subject or description..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              className="px-4 py-2 sm:px-6 sm:py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors text-sm sm:text-base"
            >
              <Filter className="w-4 h-4 sm:w-5 sm:h-5" /> 
              <span className="hidden sm:inline">Filters</span>
              {(filters.status || filters.priority || filters.email) && (
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 text-xs flex items-center justify-center">
                  {[filters.status, filters.priority, filters.email].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>
          
          {showFilters && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-6 border border-gray-200 rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Status</label>
                  <select 
                    value={filters.status} 
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Priority</label>
                  <select 
                    value={filters.priority} 
                    onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                  >
                    <option value="">All Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Email</label>
                  <input 
                    type="email" 
                    value={filters.email} 
                    onChange={(e) => setFilters(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Filter by email..." 
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                  />
                </div>
              </div>
              {(filters.status || filters.priority || filters.email || searchTerm) && (
                <div className="mt-3 sm:mt-4 flex justify-end">
                  <button 
                    onClick={clearFilters} 
                    className="text-xs sm:text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1 sm:gap-2 transition-colors"
                  >
                    <X className="w-3 h-3 sm:w-4 sm:h-4" /> 
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section Tabs */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-2 mb-6">
          <div className="flex flex-wrap gap-1 sm:gap-2">
            <button
              onClick={() => setActiveSection('all')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                activeSection === 'all' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All ({tickets.allTickets.length})
            </button>
            <button
              onClick={() => setActiveSection('assigned')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                activeSection === 'assigned' 
                  ? 'bg-orange-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Assigned ({tickets.assignedToMe.length})
            </button>
            <button
              onClick={() => setActiveSection('raised')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                activeSection === 'raised' 
                  ? 'bg-green-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Raised ({tickets.raisedByMe.length})
            </button>
            <button
              onClick={() => setActiveSection('closed')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                activeSection === 'closed' 
                  ? 'bg-gray-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Closed ({tickets.closedByMe.length})
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
          const showClosed =
            selectedTicket.status === 'closed' || selectedTicket.status === 'in-progress';
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
              <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 pr-4">{selectedTicket.subject}</h2>
                    <button 
                      className="text-gray-500 hover:text-gray-700 transition-colors p-1" 
                      onClick={closeModal}
                    >
                      <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </div>
                </div>
                
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  {/* Description */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 bg-gray-50 p-3 sm:p-4 rounded-lg text-sm sm:text-base">{selectedTicket.description}</p>
                  </div>

                  {/* Closure Description */}
                  {selectedTicket.closed_description && (
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Closure Notes</h3>
                      <p className="text-gray-700 bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200 text-sm sm:text-base">
                        {selectedTicket.closed_description}
                      </p>
                    </div>
                  )}

                  {/* Ticket Metadata */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-2">Status</h3>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(selectedTicket.status)}
                        {getStatusBadge(selectedTicket.status)}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-2">Priority</h3>
                      {getPriorityBadge(selectedTicket.priority)}
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-2">Raised By</h3>
                      <p className="text-gray-900 break-words text-sm sm:text-base">{selectedTicket.assigned_by || selectedTicket.email}</p>
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-2">Assigned To</h3>
                      <p className="text-gray-900 break-words text-sm sm:text-base">{selectedTicket.assigned_to || 'Unassigned'}</p>
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-2">Created</h3>
                      <p className="text-gray-900 text-sm sm:text-base">{formatDate(selectedTicket.created_at, true)}</p>
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-2">Last Updated</h3>
                      <p className="text-gray-900 text-sm sm:text-base">{formatDate(selectedTicket.updated_at, true)}</p>
                    </div>
                    {showClosed && (
                      <div>
                        <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-2">Closed</h3>
                        <p className="text-gray-900 text-sm sm:text-base">{formatDate(selectedTicket.updated_at, true)}</p>
                      </div>
                    )}
                  </div>

                  {/* Status Update (for assigned users or creators) */}
                  {(isAssignedUser || isTicketCreator) && (
                    <div className="border-t pt-4 sm:pt-6">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Update Status</h3>
                      
                      {/* Status Selector */}
                      <div className="mb-3 sm:mb-4">
                        <select
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 mb-2 sm:mb-3 text-sm sm:text-base"
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
                          <option value="in-progress">In Progress</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>

                      {/* Closure/Progress Description Input */}
                      {(editFields.status === 'closed' || editFields.status === 'in-progress') && (
                        <div className="mb-3 sm:mb-4">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                            {editFields.status === 'closed' ? 'Closure Description *' : 'Progress Description *'}
                          </label>
                          <textarea
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 min-h-[80px] sm:min-h-[100px] text-sm"
                            placeholder={
                              editFields.status === 'closed'
                                ? "Please provide details about how this ticket was resolved or why it's being closed..."
                                : "Please provide an update about the progress made so far..."
                            }
                            value={editFields.closed_description}
                            onChange={(e) => setEditFields(prev => ({ 
                              ...prev, 
                              closed_description: e.target.value 
                            }))}
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {editFields.status === 'closed'
                              ? 'This description will be visible to the ticket creator and other team members.'
                              : 'This progress update will be visible to the ticket creator and other team members.'}
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
                        className="w-full bg-blue-600 text-white py-2.5 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
                      >
                        Update Ticket Status
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg sm:rounded-b-xl">
                  <div className="flex justify-end gap-2 sm:gap-3">
                    <button 
                      type="button" 
                      className="px-4 py-2 sm:px-6 sm:py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Create New Ticket</h2>
                  <button 
                    className="text-gray-500 hover:text-gray-700 transition-colors p-1" 
                    onClick={closeCreateModal}
                    disabled={creating}
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </div>
              
              <form onSubmit={submitCreateTicket} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Subject</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 transition-all text-sm sm:text-base"
                    value={createFields.subject} 
                    onChange={e => handleCreateFieldChange('subject', e.target.value)} 
                    required 
                    placeholder="Brief subject of your issue"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Description</label>
                  <textarea 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 transition-all min-h-[100px] sm:min-h-[120px] text-sm sm:text-base"
                    value={createFields.description} 
                    onChange={e => handleCreateFieldChange('description', e.target.value)} 
                    required 
                    placeholder="Detailed description of the issue"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Priority</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 transition-all text-sm sm:text-base"
                    value={createFields.priority} 
                    onChange={e => handleCreateFieldChange('priority', e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <UserDropdown
                  selectedEmail={createFields.assigned_to}
                  onSelect={email => handleCreateFieldChange('assigned_to', email)}
                />
                
                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
                  <button 
                    type="button" 
                    className="px-4 py-2 sm:px-6 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base"
                    onClick={closeCreateModal}
                    disabled={creating}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 sm:px-6 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
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
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl w-full max-w-sm p-4 sm:p-6 text-center">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Notice</h3>
              <p className="text-gray-700 text-sm sm:text-base mb-4 sm:mb-6">{dialogMessage}</p>
              <button
                onClick={() => setShowDialog(false)}
                className="px-4 py-2 sm:px-6 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm sm:text-base"
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
// UserDropdown for assigning tickets
interface UserType {
  email: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: string | null;
  fullname?: string;
  role?: string;
}

const UserDropdown: React.FC<{
  selectedEmail: string;
  onSelect: (email: string) => void;
}> = ({ selectedEmail, onSelect }) => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/users/`)
      .then(res => {
        if (!res.ok) throw new Error('Could not fetch users');
        return res.json();
      })
      .then(data => {
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load users');
        setLoading(false);
      });
  }, []);

  const grouped = React.useMemo(() => {
    const groups: Record<string, UserType[]> = {};
    users.forEach(u => {
      const role = u.role || 'Others';
      if (!groups[role]) groups[role] = [];
      groups[role].push(u);
    });
    return groups;
  }, [users]);

  const selectedUser = users.find(u => u.email === selectedEmail);

  return (
    <div className="relative">
      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Assign To (Optional)</label>
      <button
        type="button"
        className="w-full flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-white hover:border-blue-400 transition-all focus:outline-none text-left text-sm"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selectedUser ? (
          <span className="flex items-center gap-2">
            {selectedUser.profile_picture ? (
              <Image
                src={selectedUser.profile_picture || '/placeholder.png'}
                alt={selectedUser.fullname || selectedUser.email}
                width={24}
                height={24}
                className="rounded-full object-cover"
              />
            ) : (
              <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs">
                {selectedUser.fullname?.[0]?.toUpperCase() || selectedUser.email[0].toUpperCase()}
              </span>
            )}
            <span className="break-words max-w-[calc(100%-32px)] text-xs sm:text-sm">
              {selectedUser.fullname || selectedUser.email} <span className="text-gray-500 text-xs">({selectedUser.email})</span>
            </span>
          </span>
        ) : (
          <span className="text-gray-400 text-xs sm:text-sm">Select a user to assign (optional)</span>
        )}
        <svg className="ml-auto w-3 h-3 sm:w-4 sm:h-4 text-gray-400" fill="none" viewBox="0 0 20 20">
          <path d="M7 8l3 3 3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="absolute z-40 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 sm:max-h-72 overflow-y-auto">
          <div className="p-2">
            <input
              type="text"
              className="w-full border border-gray-200 rounded px-2 py-1 text-xs sm:text-sm mb-2"
              placeholder="Search user..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {loading ? (
            <div className="p-4 text-center text-gray-500 text-xs sm:text-sm">Loading users...</div>
          ) : error ? (
            <div className="p-4 text-center text-red-500 text-xs sm:text-sm">{error}</div>
          ) : (
            <>
              <button
                type="button"
                className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition flex items-center gap-2 text-xs sm:text-sm ${!selectedEmail ? 'bg-blue-50' : ''}`}
                onClick={() => {
                  onSelect('');
                  setOpen(false);
                }}
              >
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xs">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 20 20">
                    <path d="M10 4v8m0 0l-4-4m4 4l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span>Unassigned</span>
              </button>
              {Object.entries(grouped).map(([role, list]) => {
                const filtered = list.filter(u =>
                  ((u.fullname?.toLowerCase() || '').includes(search.toLowerCase()) ||
                   u.email.toLowerCase().includes(search.toLowerCase()))
                );
                if (!filtered.length) return null;
                return (
                  <div key={role} className="mb-1">
                    <div className="px-3 py-1 text-xs text-gray-500 font-semibold uppercase bg-gray-50">{role}</div>
                    {filtered.map(u => (
                      <button
                        type="button"
                        key={u.email}
                        className={`w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 transition flex items-center gap-2 text-xs sm:text-sm ${selectedEmail === u.email ? 'bg-blue-100' : ''}`}
                        onClick={() => {
                          onSelect(u.email);
                          setOpen(false);
                        }}
                      >
                        {u.profile_picture ? (
                          <Image
                            src={u.profile_picture || '/placeholder.png'}
                            alt={u.fullname || u.email}
                            width={24}
                            height={24}
                            className="rounded-full object-cover ring-1 ring-gray-100"
                          />
                        ) : (
                          <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs">
                            {(u.fullname?.split(' ').map(n => n[0]).join('') || u.email[0]).toUpperCase()}
                          </span>
                        )}
                        <span className="flex flex-col items-start">
                          <span className="font-medium text-gray-900">{u.fullname || u.email}</span>
                          <span className="text-gray-500 text-xs break-words max-w-[150px] sm:max-w-[200px]">{u.email}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
};