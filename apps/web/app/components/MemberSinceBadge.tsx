'use client';

import { useState, useEffect } from 'react';

interface MemberSinceBadgeProps {
  className?: string;
  showLabel?: boolean;
  label?: string;
}

interface UserProfile {
  memberSince?: string;
  createdAt?: string;
}

export default function MemberSinceBadge({ 
  className = "",
  showLabel = true,
  label = "Member since"
}: MemberSinceBadgeProps) {
  const [memberSince, setMemberSince] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchMemberSince = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setError(true);
          setLoading(false);
          return;
        }

        const response = await fetch('/api/dashboard/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const userProfile: UserProfile = data.userProfile;
          
          // Use memberSince or fallback to createdAt
          const joinDate = userProfile?.memberSince || userProfile?.createdAt;
          
          if (joinDate) {
            // Format the date to show month and year only
            const formattedDate = new Date(joinDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long'
            });
            setMemberSince(formattedDate);
          } else {
            // Fallback date if no date is available
            setMemberSince('January 2023');
          }
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to fetch member since date:', err);
        setError(true);
        // Fallback date on error
        setMemberSince('January 2023');
      } finally {
        setLoading(false);
      }
    };

    fetchMemberSince();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-sm animate-pulse ${className}`}>
        Loading...
      </span>
    );
  }

  // Show error state (with fallback date)
  if (error && !memberSince) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r from-red-400 to-red-500 text-white shadow-sm ${className}`}>
        {showLabel && `${label} `}January 2023
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm ${className}`}>
      {showLabel && `${label} `}{memberSince}
    </span>
  );
} 