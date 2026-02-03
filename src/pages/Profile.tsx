import React from 'react';
import { Card } from '../components/Card';
import { User, Mail, Phone, MapPin, Calendar, Edit } from 'lucide-react';

export const Profile: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Parent Profile</h1>
        <p className="text-gray-600">Manage your account information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1 p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4">
              JP
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">John Parent</h2>
            <p className="text-sm text-gray-500 mb-4">Premium Member</p>
            <button className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium">
              Edit Profile
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Member Since</span>
                <span className="text-gray-900 font-medium">Jan 2024</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Stories Played</span>
                <span className="text-gray-900 font-medium">127</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Favorites</span>
                <span className="text-gray-900 font-medium">23</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
              <button className="text-primary hover:text-primary-dark transition-colors">
                <Edit className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Full Name</p>
                  <p className="text-sm font-medium text-gray-900">John Parent</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Email Address</p>
                  <p className="text-sm font-medium text-gray-900">john.parent@email.com</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                  <p className="text-sm font-medium text-gray-900">+1 (555) 123-4567</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Location</p>
                  <p className="text-sm font-medium text-gray-900">Storyville, ST</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Date of Birth</p>
                  <p className="text-sm font-medium text-gray-900">January 15, 1985</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Children Profiles */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Children Profiles</h3>
              <button className="text-primary hover:text-primary-dark transition-colors text-sm font-medium">
                + Add Child
              </button>
            </div>
            <div className="space-y-4">
              {[
                { name: 'Emma', age: 5, avatar: 'E', color: 'from-pink-400 to-pink-600' },
                { name: 'Oliver', age: 3, avatar: 'O', color: 'from-blue-400 to-blue-600' }
              ].map((child) => (
                <div key={child.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 bg-gradient-to-br ${child.color} rounded-full flex items-center justify-center text-white font-bold`}>
                      {child.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{child.name}</p>
                      <p className="text-xs text-gray-500">{child.age} years old</p>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Account Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
            <div className="space-y-3">
              <button className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 text-left transition-colors font-medium">
                Change Password
              </button>
              <button className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 text-left transition-colors font-medium">
                Export My Data
              </button>
              <button className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 rounded-lg text-sm text-red-600 text-left transition-colors font-medium">
                Delete Account
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
