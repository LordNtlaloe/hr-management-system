"use client";

import { useFormContext } from "react-hook-form";
import { EmployeeFormValues } from "@/schemas";

export default function EmployeeDetailsForm() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<EmployeeFormValues>();

  const isCitizen = watch("employee_details.is_citizen");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-600 pb-2">1-14. PERSONAL DETAILS</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Surname */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">1. Surname *</label>
          <input
            type="text"
            {...register("employee_details.surname")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter surname"
          />
          {errors.employee_details?.surname && (
            <p className="text-red-500 text-sm mt-1">{errors.employee_details.surname.message}</p>
          )}
        </div>

        {/* Section 2: Other Names */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">2. Other Names *</label>
          <input
            type="text"
            {...register("employee_details.other_names")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter other names"
          />
          {errors.employee_details?.other_names && (
            <p className="text-red-500 text-sm mt-1">{errors.employee_details.other_names.message}</p>
          )}
        </div>

        {/* Section 3: Current Address */}
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-700 mb-2">3. Current Address *</label>
          <textarea
            {...register("employee_details.current_address")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Enter complete current address"
          />
          {errors.employee_details?.current_address && (
            <p className="text-red-500 text-sm mt-1">{errors.employee_details.current_address.message}</p>
          )}
        </div>

        {/* Section 4: Date of Birth */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">4. Date of Birth *</label>
          <input
            type="date"
            {...register("employee_details.date_of_birth")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.employee_details?.date_of_birth && (
            <p className="text-red-500 text-sm mt-1">{errors.employee_details.date_of_birth.message}</p>
          )}
        </div>

        {/* Section 5: Age */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">5. Age *</label>
          <input
            type="number"
            {...register("employee_details.age", { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter age"
          />
          {errors.employee_details?.age && (
            <p className="text-red-500 text-sm mt-1">{errors.employee_details.age.message}</p>
          )}
        </div>

        {/* Section 6: Gender */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">6. Gender *</label>
          <select
            {...register("employee_details.gender")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          {errors.employee_details?.gender && (
            <p className="text-red-500 text-sm mt-1">{errors.employee_details.gender.message}</p>
          )}
        </div>

        {/* Section 7: Place of Birth */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">7. Place of Birth *</label>
          <input
            type="text"
            {...register("employee_details.place_of_birth")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter place of birth"
          />
          {errors.employee_details?.place_of_birth && (
            <p className="text-red-500 text-sm mt-1">{errors.employee_details.place_of_birth.message}</p>
          )}
        </div>

        {/* Section 8: Citizenship Status */}
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-700 mb-2">8. Citizenship Status *</label>
          <div className="flex items-center space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                {...register("employee_details.is_citizen")}
                value="true"
                className="text-blue-600 focus:ring-blue-500"
                defaultChecked
              />
              <span className="ml-2">Citizen</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                {...register("employee_details.is_citizen")}
                value="false"
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2">Non-Citizen</span>
            </label>
          </div>
        </div>

        {/* Conditional Fields based on Citizenship */}
        {isCitizen ? (
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50 p-4 rounded-lg">
            <h3 className="md:col-span-3 text-lg font-bold text-blue-800 mb-2">Citizen Information</h3>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">9. Chief's Name *</label>
              <input
                type="text"
                {...register("employee_details.citizen_info.chief_name")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter chief's name"
              />
              {errors.employee_details?.citizen_info?.chief_name && (
                <p className="text-red-500 text-sm mt-1">{errors.employee_details.citizen_info.chief_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">10. District *</label>
              <input
                type="text"
                {...register("employee_details.citizen_info.district")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter district"
              />
              {errors.employee_details?.citizen_info?.district && (
                <p className="text-red-500 text-sm mt-1">{errors.employee_details.citizen_info.district.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">11. Tax ID *</label>
              <input
                type="text"
                {...register("employee_details.citizen_info.tax_id")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter tax ID"
              />
              {errors.employee_details?.citizen_info?.tax_id && (
                <p className="text-red-500 text-sm mt-1">{errors.employee_details.citizen_info.tax_id.message}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 bg-yellow-50 p-4 rounded-lg">
            <h3 className="md:col-span-3 text-lg font-bold text-yellow-800 mb-2">Non-Citizen Information</h3>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">9. Certificate Number *</label>
              <input
                type="text"
                {...register("employee_details.non_citizen_info.certificate_number")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter certificate number"
              />
              {errors.employee_details?.non_citizen_info?.certificate_number && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.employee_details.non_citizen_info.certificate_number.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">10. Date of Issue *</label>
              <input
                type="date"
                {...register("employee_details.non_citizen_info.date_of_issue")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.employee_details?.non_citizen_info?.date_of_issue && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.employee_details.non_citizen_info.date_of_issue.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">11. Present Nationality *</label>
              <input
                type="text"
                {...register("employee_details.non_citizen_info.present_nationality")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter present nationality"
              />
              {errors.employee_details?.non_citizen_info?.present_nationality && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.employee_details.non_citizen_info.present_nationality.message}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Email Section - Required for user account creation */}
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-700 mb-2">13. Email Address *</label>
          <input
            type="email"
            {...register("employee_details.email")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter email address for user account"
          />
          <p className="text-xs text-gray-500 mt-1">
            This email will be used to create a user account with default password "user123"
          </p>
          {errors.employee_details?.email && (
            <p className="text-red-500 text-sm mt-1">{errors.employee_details.email.message}</p>
          )}
        </div>

        {/* Section 12: Telephone Number */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">12. Telephone Number</label>
          <input
            type="tel"
            {...register("employee_details.telephone")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter telephone number"
          />
        </div>

        {/* Section 14: Emergency Contact */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">14. Emergency Contact</label>
          <input
            type="text"
            {...register("employee_details.emergency_contact")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter emergency contact details"
          />
        </div>
      </div>
    </div>
  );
}