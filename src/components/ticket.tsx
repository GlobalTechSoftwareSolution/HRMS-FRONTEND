"use client";

import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Calendar, User, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';

export interface Ticket {
 id: string;
 subject?: string;
 title: string;
 description: string;
 status: 'open' | 'in-progress' | 'resolved' | 'closed';
 priority: 'low' | 'medium' | 'high' | 'urgent';
 email: string;
 created_at: string;
 updated_at: string;
 assigned_to?: string | null;
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
 const [tickets, setTickets] = useState<Ticket[]>([]);
 // ------------------------------
 // Modal State & Handlers
 // ------------------------------
 const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
 const [showModal, setShowModal] = useState(false);
 const [editFields, setEditFields] = useState<{
 status: Ticket['status'];
 }>({ status: 'open' });

 // Open modal and set selected ticket
 const openModal = (ticket: Ticket) => {
 setSelectedTicket(ticket);
 setEditFields({
 status: ticket.status,
 });
 setShowModal(true);
 };

 // Close modal
 const closeModal = () => {
 setShowModal(false);
 setSelectedTicket(null);
 };

 const [searchTerm, setSearchTerm] = useState('');
 const [filters, setFilters] = useState({
 status: statusFilter || '',
 priority: priorityFilter || '',
 email: email || ''
 });
 const [showFilters, setShowFilters] = useState(false);

 useEffect(() => {
 fetchTickets();
 }, []);

 // Always use localStorage.user_email for filtering
 const fetchTickets = async () => {
   try {
     const userEmail = localStorage.getItem('user_email') || '';
     const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/tickets/`);
     if (!response.ok) {
       throw new Error('Failed to fetch tickets');
     }
     const data = await response.json();
     // Normalize status: lowercase and replace spaces with hyphens
     const normalizeStatus = (status: string) => status.toLowerCase().replace(' ', '-');
     // Filter tickets: assigned_to is null OR matches userEmail (case-insensitive)
     const filteredData: Ticket[] = data
       .filter((ticket: Ticket) =>
         ticket.assigned_to === null ||
         (userEmail && ticket.assigned_to && ticket.assigned_to.toLowerCase() === userEmail.toLowerCase())
       )
       .map((ticket: Ticket) => ({
         ...ticket,
         status: normalizeStatus(ticket.status),
         priority: ticket.priority.toLowerCase(),
       }));
     console.log('Filtered Tickets:', filteredData);
     setTickets(filteredData);
   } catch (error) {
     console.error('Error fetching tickets:', error);
     setTickets([]);
   }
 };

 // ------------------------------
 // Create Ticket Modal State & Handlers
 // ------------------------------
 const [showCreateModal, setShowCreateModal] = useState(false);
 const [createFields, setCreateFields] = useState({
 subject: '',
 title: '',
 description: '',
 priority: 'medium',
 assigned_to: '',
 });
 const [creating, setCreating] = useState(false);
 const openCreateModal = () => {
 setCreateFields({
 subject: '',
 title: '',
 description: '',
 priority: 'medium',
 assigned_to: '',
 });
 setShowCreateModal(true);
 };
 const closeCreateModal = () => {
 setShowCreateModal(false);
 };
 const handleCreateFieldChange = (field: string, value: string) => {
 setCreateFields(prev => ({ ...prev, [field]: value }));
 };
 const submitCreateTicket = async (e: React.FormEvent) => {
 e.preventDefault();
 setCreating(true);
 try {
 const userEmail = localStorage.getItem('user_email') || '';
 const payload = {
 subject: createFields.subject,
 description: createFields.description,
 status: 'Closed', // or 'Open' if default
 priority: createFields.priority.charAt(0).toUpperCase() + createFields.priority.slice(1), // e.g., "Medium"
 assigned_to: createFields.assigned_to || null,
 email: userEmail,
 };

 console.log("🔹 CREATE Ticket Payload:", payload);

 const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/tickets/`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(payload),
 });

 if (!response.ok) {
 const text = await response.text();
 console.error('❌ CREATE Error Response:', text);
 throw new Error('Failed to create ticket');
 }

 const createdTicket = await response.json();
 console.log("✅ Created Ticket:", createdTicket);

 setTickets(prevTickets => [
 ...prevTickets,
 {
 ...createdTicket,
 status: createdTicket.status?.toLowerCase() || 'open',
 priority: createdTicket.priority?.toLowerCase() || 'medium',
 },
 ]);

 setShowCreateModal(false);
 setCreateFields({
 subject: '',
 title: '',
 description: '',
 priority: 'medium',
 assigned_to: '',
 });

 } catch (error) {
 console.error('Error creating ticket:', error);
 } finally {
 setCreating(false);
 }
 };

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
 {/* ------------------------------
 Header / Create Ticket
 ------------------------------ */}
 <div className="mb-8">
 <div className="flex justify-between items-center">
 <div>
 <h1 className="text-3xl font-bold text-gray-900">Tickets</h1>
 <p className="text-gray-600 mt-2">Manage and track tickets</p>
 </div>
 {showCreateButton && (
 <button
 onClick={openCreateModal}
 className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
 >
 <Plus className="w-5 h-5" />
 Create Ticket
 </button>
 )}
 </div>
 </div>

 {/* ------------------------------
 Search and Filters
 ------------------------------ */}
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

 {/* ------------------------------
 Tickets Grid
 ------------------------------ */}
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
 className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-6 cursor-pointer"
 >
 <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
 <div className="flex-1">
 <div className="flex items-start justify-between mb-3">
 <div className="text-2xl font-semibold text-gray-900">{ticket.title}</div>
 <div className="text-xl text-gray-800">{ticket.subject}</div>
 <div className="flex items-center gap-2">
 {getStatusIcon(ticket.status)}
 <span className="font-bold text-medium capitalize text-gray-700">
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
 <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
 </div>
 <div>
 {getPriorityBadge(ticket.priority)}
 </div>
 </div>
 </div>
 <div className="flex sm:flex-col gap-2">
 <button
 className="px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
 onClick={() => openModal(ticket)}
 >
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

 {/* ------------------------------
 Stats
 ------------------------------ */}
 <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
 <div className="bg-white p-4 rounded-lg border">
 <div className="text-2xl font-bold text-gray-900">{filteredTickets.length}</div>
 <div className="text-gray-600">Total Tickets</div>
 </div>
 <div className="bg-white p-4 rounded-lg border">
 <div className="text-2xl font-bold text-red-600">
 {filteredTickets.filter(t => t.status.toLowerCase() === 'open').length}
 </div>
 <div className="text-gray-600">Open</div>
 </div>
 <div className="bg-white p-4 rounded-lg border">
 <div className="text-2xl font-bold text-blue-600">
 {filteredTickets.filter(t => t.status.toLowerCase() === 'in-progress').length}
 </div>
 <div className="text-gray-600">In Progress</div>
 </div>
 <div className="bg-white p-4 rounded-lg border">
 <div className="text-2xl font-bold text-green-600">
 {filteredTickets.filter(t => t.status.toLowerCase() === 'resolved').length}
 </div>
 <div className="text-gray-600">Resolved</div>
 </div>
 </div>

 {/* ------------------------------
 Modal (ticket details + update)
 ------------------------------ */}
{showModal && selectedTicket && (() => {
 const userEmail = localStorage.getItem('user_email') || '';
 const isAssignedUser =
 selectedTicket.assigned_to?.toLowerCase() === userEmail.toLowerCase();
 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
 <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
 {/* Close button */}
 <button
 className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
 onClick={closeModal}
 aria-label="Close"
 >
 <X className="w-6 h-6" />
 </button>
 <h2 className="text-2xl font-bold mb-2">{selectedTicket.title}</h2>
 <div className="mb-4 text-gray-600">{selectedTicket.description}</div>
 <div className="mb-2 flex flex-wrap gap-4 text-sm">
 <div>
 <span className="font-medium">Status:</span>{' '}
 <span className="capitalize">{selectedTicket.status.replace('-', ' ')}</span>
 </div>
 <div>
 <span className="font-medium">Priority:</span>{' '}
 <span className="capitalize">{selectedTicket.priority}</span>
 </div>
 <div>
 <span className="font-medium">Assigned To:</span>{' '}
 {selectedTicket.assigned_to || <span className="italic text-gray-400">Unassigned</span>}
 </div>
 <div>
 <span className="font-medium">Email:</span> {selectedTicket.email}
 </div>
 <div>
 <span className="font-medium">Created At:</span>{' '}
 {new Date(selectedTicket.created_at).toLocaleString()}
 </div>
 <div>
 <span className="font-medium">Updated At:</span>{' '}
 {new Date(selectedTicket.updated_at).toLocaleString()}
 </div>
 </div>
 <hr className="my-4" />
 {/* Only select for status, no Update button. Auto-patch if assigned */}
 <div className="mb-4">
 <label className="block text-sm font-medium mb-1">Status</label>
 <select
 className="w-full border border-gray-300 rounded-lg px-3 py-2"
 value={editFields.status}
 onChange={async e => {
 const newStatus = e.target.value as Ticket['status'];
 setEditFields(f => ({ ...f, status: newStatus }));
 const userEmail = localStorage.getItem('user_email') || '';
 const isAssignedUser = selectedTicket.assigned_to?.toLowerCase() === userEmail.toLowerCase();
 if (!isAssignedUser) {
 console.warn("Cannot update ticket: Not assigned to this user");
 return;
 }
 // Map to backend expected casing
 const statusMap: Record<Ticket['status'], string> = {
 'open': 'Open',
 'in-progress': 'In Progress',
 'resolved': 'Resolved',
 'closed': 'Closed'
 };
 const patchPayload = { id: selectedTicket.id, status: statusMap[newStatus] };
 const patchUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/tickets/${userEmail}/`;
 console.log("🔹 PATCH URL:", patchUrl);
 console.log("🔹 PATCH Payload:", patchPayload);
 try {
 const response = await fetch(
 patchUrl,
 {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(patchPayload),
 }
 );
 console.log("🔹 PATCH Response Status:", response.status);
 if (!response.ok) {
 const text = await response.text();
 console.error("❌ PATCH Error Response:", text);
 throw new Error('Failed to update ticket');
 }
 const updatedTicket = await response.json();
 console.log("✅ Updated Ticket:", updatedTicket);
 setTickets(prev =>
 prev.map(t =>
 t.id === updatedTicket.id
 ? { ...t, ...updatedTicket, status: updatedTicket.status.toLowerCase(), priority: updatedTicket.priority.toLowerCase() }
 : t
 )
 );
 setShowModal(false);
 setSelectedTicket(null);
 fetchTickets();
 } catch (error) {
 console.error('🔥 Error updating ticket:', error);
 }
 }}
 disabled={!isAssignedUser}
 >
 <option value="open">Open</option>
 <option value="in-progress">In Progress</option>
 <option value="resolved">Resolved</option>
 <option value="closed">Closed</option>
 </select>
 </div>
 <div className="flex justify-end gap-2">
 <button
 type="button"
 className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
 onClick={closeModal}
 >
 Cancel
 </button>
 </div>
 </div>
 </div>
 );
})()}

{/* ------------------------------
 Create Ticket Modal
 ------------------------------ */}
{showCreateModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
 <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
 <button
 className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
 onClick={closeCreateModal}
 aria-label="Close"
 disabled={creating}
 >
 <X className="w-6 h-6" />
 </button>
 <h2 className="text-2xl font-bold mb-4">Create Ticket</h2>
 <form onSubmit={submitCreateTicket} className="space-y-4">
 <div>
 <label className="block text-sm font-medium mb-1">Subject</label>
 <input
 type="text"
 className="w-full border border-gray-300 rounded-lg px-3 py-2"
 value={createFields.subject}
 onChange={e => handleCreateFieldChange('subject', e.target.value)}
 required
 />
 </div>
 <div>
 <label className="block text-sm font-medium mb-1">Title</label>
 <input
 type="text"
 className="w-full border border-gray-300 rounded-lg px-3 py-2"
 value={createFields.title}
 onChange={e => handleCreateFieldChange('title', e.target.value)}
 required
 />
 </div>
 <div>
 <label className="block text-sm font-medium mb-1">Description</label>
 <textarea
 className="w-full border border-gray-300 rounded-lg px-3 py-2"
 value={createFields.description}
 onChange={e => handleCreateFieldChange('description', e.target.value)}
 required
 />
 </div>
 <div>
 <label className="block text-sm font-medium mb-1">Priority</label>
 <select
 className="w-full border border-gray-300 rounded-lg px-3 py-2"
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
 <label className="block text-sm font-medium mb-1">Assigned To</label>
 <input
 type="text"
 className="w-full border border-gray-300 rounded-lg px-3 py-2"
 value={createFields.assigned_to}
 onChange={e => handleCreateFieldChange('assigned_to', e.target.value)}
 placeholder="email to assign (optional)"
 />
 </div>
 <div className="flex justify-end gap-2 mt-4">
 <button
 type="button"
 className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
 onClick={closeCreateModal}
 disabled={creating}
 >
 Cancel
 </button>
 <button
 type="submit"
 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
 disabled={creating}
 >
 {creating ? 'Creating...' : 'Create'}
 </button>
 </div>
 </form>
 </div>
 </div>
)}
</div>
</div>
);
};

export default Ticket;