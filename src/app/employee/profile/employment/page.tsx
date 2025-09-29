import React from "react";

type EmploymentDetails = {
  employeeId: string;
  dateOfJoining: string;
  workLocation: string;
  employmentType: string;
  designation: string;
  salary?: string;
  reportingManager?: string;
  team?: string;
};

interface EmploymentInfoTabProps {
  user: {
    department?: string;
    employmentDetails?: EmploymentDetails;
  };
  isEditing: boolean;
  handleInputChange: (field: string, value: string) => void;
  handleNestedChange: (section: "employmentDetails", key: string, value: string) => void;
}

const EmploymentInfoTab: React.FC<EmploymentInfoTabProps> = ({ 
  user, 
  isEditing, 
  handleInputChange, 
  handleNestedChange 
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
          <input 
            type="text" 
            value={user.employmentDetails?.employeeId || ""} 
            disabled 
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Joining</label>
          <input 
            type="date" 
            value={user.employmentDetails?.dateOfJoining || ""} 
            disabled 
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
          <select
            value={user.department || ""}
            onChange={(e) => handleInputChange('department', e.target.value)}
            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!isEditing ? "bg-gray-50 pointer-events-none" : ""}`}
          >
            <option value="">Select Department</option>
            <option value="Engineering">Engineering</option>
            <option value="Marketing">Marketing</option>
            <option value="Sales">Sales</option>
            <option value="HR">Human Resources</option>
            <option value="Finance">Finance</option>
            <option value="Operations">Operations</option>
            <option value="IT">Information Technology</option>
            <option value="R&D">Research & Development</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
          <input
            type="text"
            value={user.employmentDetails?.designation || ""}
            onChange={(e) => handleNestedChange("employmentDetails", "designation", e.target.value)}
            disabled={!isEditing}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
          <select
            value={user.employmentDetails?.employmentType || ""}
            onChange={(e) => handleNestedChange("employmentDetails", "employmentType", e.target.value)}
            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!isEditing ? "bg-gray-50 pointer-events-none" : ""}`}
          >
            <option value="">Select Type</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Intern">Intern</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Work Location</label>
          <input
            type="text"
            value={user.employmentDetails?.workLocation || ""}
            onChange={(e) => handleNestedChange("employmentDetails", "workLocation", e.target.value)}
            disabled={!isEditing}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Reporting Manager</label>
          <input
            type="text"
            value={user.employmentDetails?.reportingManager || ""}
            onChange={(e) => handleNestedChange("employmentDetails", "reportingManager", e.target.value)}
            disabled={!isEditing}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Team</label>
          <input
            type="text"
            value={user.employmentDetails?.team || ""}
            onChange={(e) => handleNestedChange("employmentDetails", "team", e.target.value)}
            disabled={!isEditing}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
          />
        </div>
      </div>
    </div>
  );
};

export default EmploymentInfoTab;