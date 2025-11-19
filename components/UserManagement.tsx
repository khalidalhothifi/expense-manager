
import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, Button, Input, Select, Modal, ConfirmationModal } from './UI';
import { User, Role } from '../types';

const UserForm: React.FC<{ user?: User, onClose: () => void }> = ({ user, onClose }) => {
    const { addUser, updateUser, groups, t } = useAppContext();
    const [formData, setFormData] = useState<Omit<User, 'id'>>({
        name: user?.name || '',
        email: user?.email || '',
        role: user?.role || Role.USER,
        password: '',
    });
    
    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

    useEffect(() => {
        if (user) {
            const userGroups = groups.filter(g => g.memberIds.includes(user.id)).map(g => g.id);
            setSelectedGroupIds(userGroups);
        } else {
            setSelectedGroupIds([]);
        }
    }, [user, groups]);

    const isEditing = !!user;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGroupChange = (groupId: string) => {
        setSelectedGroupIds(prev => 
            prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing) {
            await updateUser(user.id, { name: formData.name, email: formData.email, role: formData.role }, selectedGroupIds);
        } else {
            if (!formData.password) {
                alert(t('userManagement.form.passwordRequired'));
                return;
            }
            await addUser(formData, selectedGroupIds);
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input name="name" value={formData.name} onChange={handleChange} placeholder={t('userManagement.form.fullName')} required />
            <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder={t('userManagement.form.emailAddress')} required />
            {!isEditing && (
                 <Input name="password" type="password" value={formData.password} onChange={handleChange} placeholder={t('userManagement.form.password')} required />
            )}
            <Select name="role" value={formData.role} onChange={handleChange}>
                <option value={Role.USER}>{t('enums.role.user')}</option>
                <option value={Role.FINANCE_MANAGER}>{t('enums.role.manager')}</option>
            </Select>
            
            <div>
                <label className="block text-sm font-medium text-text-dim mb-2">{t('userManagement.form.assignGroups')}</label>
                <div className="grid grid-cols-2 gap-2 border p-3 rounded-md max-h-40 overflow-y-auto">
                    {groups.map(group => (
                        <label key={group.id} className="flex items-center space-x-2 text-sm cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={selectedGroupIds.includes(group.id)}
                                onChange={() => handleGroupChange(group.id)}
                                className="rounded text-primary focus:ring-primary"
                            />
                            <span>{group.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            <Button type="submit" className="w-full">{isEditing ? t('userManagement.form.save') : t('userManagement.form.create')}</Button>
        </form>
    );
};


const UserManagement: React.FC = () => {
    const { users, deleteUser, resetPassword, t } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = roleFilter === 'all' || u.role === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [users, searchQuery, roleFilter]);

    const openModalForEdit = (user: User) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };
    
    const openModalForNew = () => {
        setSelectedUser(undefined);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedUser(undefined);
    };

    const confirmDelete = (userId: string) => {
        setUserToDelete(userId);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = () => {
        if (userToDelete) {
            deleteUser(userToDelete);
            setUserToDelete(null);
        }
    };

    const handleResetPassword = (userId: string) => {
        if (confirm(t('userManagement.confirmReset'))) {
            resetPassword(userId);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-text-main">{t('userManagement.title')}</h1>
                <Button onClick={openModalForNew}>{t('userManagement.addUser')}</Button>
            </div>
            
            <Card>
                 <div className="mb-4 flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <Input 
                            placeholder={t('filters.searchUsers')} 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                        />
                    </div>
                    <div className="w-full md:w-1/3">
                         <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                            <option value="all">{t('filters.allRoles')}</option>
                            <option value={Role.USER}>{t('enums.role.user')}</option>
                            <option value={Role.FINANCE_MANAGER}>{t('enums.role.manager')}</option>
                         </Select>
                    </div>
                 </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-start text-xs font-medium text-text-dim uppercase tracking-wider">{t('userManagement.name')}</th>
                                <th className="px-6 py-3 text-start text-xs font-medium text-text-dim uppercase tracking-wider">{t('userManagement.email')}</th>
                                <th className="px-6 py-3 text-start text-xs font-medium text-text-dim uppercase tracking-wider">{t('userManagement.role')}</th>
                                <th className="px-6 py-3 text-start text-xs font-medium text-text-dim uppercase tracking-wider">{t('userManagement.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map(user => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{user.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{t(`enums.role.${user.role === Role.FINANCE_MANAGER ? 'manager' : 'user'}`)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm flex items-center space-x-2">
                                        <Button onClick={() => openModalForEdit(user)} className="text-xs !bg-blue-500 hover:!bg-blue-600 px-2 py-1">{t('userManagement.edit')}</Button>
                                        <Button onClick={() => handleResetPassword(user.id)} className="text-xs !bg-yellow-500 hover:!bg-yellow-600 px-2 py-1">{t('userManagement.resetPass')}</Button>
                                        <Button onClick={() => confirmDelete(user.id)} className="text-xs !bg-red-500 hover:!bg-red-600 px-2 py-1">{t('userManagement.delete')}</Button>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-text-dim">{t('filters.noResults')}</td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="bg-gray-50">
                            <tr>
                                <td colSpan={4} className="px-6 py-3 text-sm font-medium text-text-dim text-center">
                                    {t('filters.totalRecords', { count: filteredUsers.length })}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={closeModal} title={selectedUser ? t('userManagement.editTitle') : t('userManagement.addTitle')}>
                <UserForm user={selectedUser} onClose={closeModal} />
            </Modal>

            <ConfirmationModal 
                isOpen={isDeleteModalOpen} 
                onClose={() => setIsDeleteModalOpen(false)} 
                onConfirm={handleDelete}
                title={t('confirmation.deleteUserTitle')}
                message={t('confirmation.deleteUserMessage')}
            />
        </div>
    );
};

export default UserManagement;
