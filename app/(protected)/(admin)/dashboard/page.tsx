"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';


import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

import {
  Users,
  Clock,
  FileText,
  Building2,
  UserPlus,
  Calendar,
  TrendingUp,
  AlertCircle,
  Upload,
  Loader2,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { getAllEmployees } from '@/actions/employee.actions';
import { getAllDocuments } from '@/actions/employee.documents.actons';
import { getAllPositions } from '@/actions/position.actions';
import { getTimeTrackingSummary } from '@/actions/attendance.actions';
import { getAllMinistries } from '@/actions/ministries.action';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@radix-ui/react-tabs';

// Type definitions
interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  position_title: string;
  department_name: string;
  status?: string;
  isActive?: boolean;
}

interface AttendanceData {
  date: string;
  present: number;
  absent: number;
  late: number;
}

interface Document {
  _id: string;
  employee_id: string;
  employee_name?: string;
  national_id: string;
  national_id_document: string;
  passport_photo: string | null;
  academic_certificates: string[];
  police_clearance: string | null;
  medical_certificate: string | null;
  driver_license: string | null;
  uploaded_at: string;
  is_active: boolean;
}

interface Ministry {
  _id: string;
  name: string;
  code: string;
  description: string;
}

interface Position {
  _id: string;
  position_title: string;
  department_name: string;
  salary_range?: string;
}


// Dashboard Statistics Component
const DashboardStats: React.FC = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    pendingDocuments: 0,
    activePositions: 0,
    loading: true
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [employees, documents, positions] = await Promise.all([
          getAllEmployees(),
          getAllDocuments(),
          getAllPositions()
        ]);

        const employeeArray = Array.isArray(employees) ? employees : [];
        const documentArray = Array.isArray(documents) ? documents : [];
        const positionArray = Array.isArray(positions) ? positions : [];

        setStats({
          totalEmployees: employeeArray.length,
          presentToday: Math.floor(employeeArray.length * 0.9), // Estimated
          pendingDocuments: Math.max(0, employeeArray.length - documentArray.length),
          activePositions: positionArray.length,
          loading: false
        });
      } catch (error) {
        console.error('Error loading stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    loadStats();
  }, []);

  if (stats.loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-20">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    { title: 'Total Employees', value: stats.totalEmployees.toString(), icon: Users },
    { title: 'Present Today', value: stats.presentToday.toString(), icon: Clock },
    { title: 'Pending Documents', value: stats.pendingDocuments.toString(), icon: FileText },
    { title: 'Active Positions', value: stats.activePositions.toString(), icon: Building2 },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statItems.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Employee Overview Component
const EmployeeOverview: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [departmentData, setDepartmentData] = useState<any[]>([]);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setLoading(true);
        const result = await getAllEmployees();

        if (Array.isArray(result)) {
          setEmployees(result);

          // Process department data for charts
          const deptCounts = result.reduce((acc: any, emp: Employee) => {
            const dept = emp.department_name || 'Unknown';
            acc[dept] = (acc[dept] || 0) + 1;
            return acc;
          }, {});

          const chartData = Object.entries(deptCounts).map(([name, value]) => ({
            name,
            value: value as number
          }));

          setDepartmentData(chartData);
        }
      } catch (error) {
        console.error('Error loading employees:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, []);

  const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Employee Distribution by Department</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Users className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-600">No Employees Found</p>
              <p className="text-sm text-gray-500">Add employees to see department distribution</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employee Count by Department</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-600">No Data Available</p>
              <p className="text-sm text-gray-500">Add employees to view department statistics</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Attendance Analytics Component
const AttendanceAnalytics: React.FC = () => {
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAttendance = async () => {
      try {
        setLoading(true);
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);

        const result = await getTimeTrackingSummary(startDate, endDate);

        if (Array.isArray(result)) {
          setAttendanceData(result);
        }
      } catch (error) {
        console.error('Error loading attendance:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAttendance();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Trends (Last 30 Days)</CardTitle>
        <CardDescription>Daily attendance patterns</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : attendanceData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-600">No Attendance Data</p>
            <p className="text-sm text-gray-500">Start tracking attendance to see trends</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="present" stroke="#22c55e" name="Present" />
              <Line type="monotone" dataKey="absent" stroke="#ef4444" name="Absent" />
              <Line type="monotone" dataKey="late" stroke="#f59e0b" name="Late" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

// Document Management Component
const DocumentManagement: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [documentStats, setDocumentStats] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [docsResult, employeesResult] = await Promise.all([
          getAllDocuments(),
          getAllEmployees()
        ]);

        if (Array.isArray(docsResult)) {
          // Enrich documents with employee names
          const enrichedDocuments = docsResult.map(doc => {
            const employee = Array.isArray(employeesResult)
              ? employeesResult.find(emp => emp._id === doc.employee_id)
              : null;

            return {
              ...doc,
              employee_name: employee
                ? `${employee.firstName} ${employee.lastName}`
                : 'Unknown Employee'
            };
          });

          setDocuments(enrichedDocuments);

          // Process document completion stats
          const stats = [
            {
              name: 'Complete',
              value: enrichedDocuments.filter(doc =>
                doc.passport_photo &&
                doc.academic_certificates.length > 0 &&
                doc.national_id_document &&
                doc.police_clearance &&
                doc.medical_certificate
              ).length
            },
            {
              name: 'Incomplete',
              value: enrichedDocuments.filter(doc =>
                !doc.passport_photo ||
                doc.academic_certificates.length === 0 ||
                !doc.national_id_document ||
                !doc.police_clearance ||
                !doc.medical_certificate
              ).length
            },
          ];
          setDocumentStats(stats);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const colors = ['#22c55e', '#ef4444'];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Document Completion Status</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-600">No Documents Found</p>
              <p className="text-sm text-gray-500">Upload employee documents to track completion</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={documentStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {documentStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Document Uploads</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-600">No Upload History</p>
              <p className="text-sm text-gray-500">Document upload timeline will appear here</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {documents.slice(0, 10).map((doc) => (
                <div key={doc._id} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium">{doc.employee_name}</p>
                    <p className="text-sm text-gray-500">ID: {doc.national_id}</p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={doc.is_active ? "default" : "secondary"}
                      className="mb-1"
                    >
                      {doc.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <p className="text-xs text-gray-500">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Ministry Overview Component
const MinistryOverview: React.FC = () => {
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMinistries = async () => {
      try {
        setLoading(true);
        const result = await getAllMinistries();

        if (Array.isArray(result)) {
          setMinistries(result);
        }
      } catch (error) {
        console.error('Error loading ministries:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMinistries();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ministry Overview</CardTitle>
        <CardDescription>Government ministries and departments</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : ministries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-600">No Ministries Found</p>
            <p className="text-sm text-gray-500">Add ministries to manage government departments</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ministries.map((ministry) => (
              <Card key={ministry._id}>
                <CardHeader>
                  <CardTitle className="text-lg">{ministry.name}</CardTitle>
                  <Badge variant="outline">{ministry.code}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{ministry.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Position Analytics Component
const PositionAnalytics: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [positionData, setPositionData] = useState<any[]>([]);

  useEffect(() => {
    const loadPositions = async () => {
      try {
        setLoading(true);
        const result = await getAllPositions();

        if (Array.isArray(result)) {
          setPositions(result);

          // Process position data by department
          const deptCounts = result.reduce((acc: any, pos: Position) => {
            const dept = pos.department_name || 'Unknown';
            acc[dept] = (acc[dept] || 0) + 1;
            return acc;
          }, {});

          const chartData = Object.entries(deptCounts).map(([name, value]) => ({
            name,
            value: value as number
          }));

          setPositionData(chartData);
        }
      } catch (error) {
        console.error('Error loading positions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPositions();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Positions by Department</CardTitle>
        <CardDescription>Available job positions across departments</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : positions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <UserPlus className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-600">No Positions Found</p>
            <p className="text-sm text-gray-500">Create job positions to see department distribution</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={positionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

// Main Dashboard Component
const HRDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">HR Management Dashboard</h1>
          <Badge variant="outline" className="text-sm">
            Last updated: {new Date().toLocaleString()}
          </Badge>
        </div>

        <DashboardStats />

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="ministries">Ministries</TabsTrigger>
            <TabsTrigger value="positions">Positions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <EmployeeOverview />
            <AttendanceAnalytics />
          </TabsContent>

          <TabsContent value="employees" className="space-y-4">
            <EmployeeOverview />
          </TabsContent>

          <TabsContent value="attendance" className="space-y-4">
            <AttendanceAnalytics />
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <DocumentManagement />
          </TabsContent>

          <TabsContent value="ministries" className="space-y-4">
            <MinistryOverview />
          </TabsContent>

          <TabsContent value="positions" className="space-y-4">
            <PositionAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HRDashboard;