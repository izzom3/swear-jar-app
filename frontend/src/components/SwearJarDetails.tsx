import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import jarService from '../services/jarService.ts';
import { io } from 'socket.io-client';

interface Member {
    name: string;
    amount: number;
}

interface Transaction {
    _id: string;
    swearJarId: string;
    userId: string;
    action: string;
    details: { name: string; amount: number };
}
interface User {
    _id: string;
    username: string;
}

const SwearJarDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [jar, setJar] = useState<any>(null);
    const [memberName, setMemberName] = useState('');
    const [amount, setAmount] = useState('');
    const [username, setUsername] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [message, setMessage] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const socket = useRef(io(process.env.REACT_APP_BACKEND_URL)).current;

    const fetchJar = useCallback(async () => {
        try {
            if (id) {
                console.log("Fetching jar data...");
                const data = await jarService.getJar(id);
                console.log("Jar data fetched:", data);
                setJar(data);
            }
        } catch (error) {
            console.error("Error fetching jar", error);
        }
    }, [id]);

    const fetchTransactions = useCallback(async () => {
        try {
            if (id) {
                console.log("Fetching transactions data...");
                const transactionData = await jarService.getTransactions(id);
                setTransactions(transactionData);
                console.log("Transactions data fetched:", transactionData);
            }
            } catch (error) {
                console.error("Error fetching transactions", error);
            }
    }, [id]);

    useEffect(() => {
        console.log("Component mounted or fetchJar/fetchTransactions updated");
        fetchJar();
        fetchTransactions();
    }, [fetchJar, fetchTransactions]);

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            setUsername(storedUsername);
        }
    }, []);

    useEffect(() => {
        const fetchUsers = async () => {
            console.log("Fetching all users...");
            try {
                const allUsers = await jarService.getAllUsers();
                setUsers(allUsers);
            } catch (error) {
                console.error("Error fetching users:", error);
                // Optionally, set an error state here to display an error message to the user.
            }
        };
        fetchUsers();
    }, []);
        useEffect(() => {
          if (!socket) return;
          console.log("Setting up socket event listeners...");

          socket.on("connect", () => {
            console.log("Socket connected with ID:", socket.id);
        });

          socket.on("newTransaction", (message: Transaction) => {
            console.log("Received newTransaction event:", message);
            setTransactions((prevTransactions) => {
                const newTransactions = [...prevTransactions, message]
                  .filter((value, index, self) =>
                    index === self.findIndex((t) => (
                      t._id === value._id
                    ))
                  );
                return newTransactions;
              });
              fetchTransactions();
              fetchJar();
          });

          socket.on("disconnect", () => {
            console.log("Socket disconnected");
          });

          return () => {
            console.log("Cleaning up socket event listeners");
            socket.off("connect");
            socket.off("newTransaction");
            socket.off("disconnect");
          };
        }, [socket, fetchTransactions, fetchJar, id]);

        const transactionList = useMemo(() => {
            return (
              <ul>
                {transactions.map((transaction) => (
                  <li key={transaction._id}>
                    {transaction.userId} has done: {transaction.action} - {transaction.details.name}{" "} with amount:
                    {transaction.details.amount}
                  </li>
                ))}
              </ul>
            );
          }, [transactions]);

    const handleAddMoney = async () => {
        if (!id || !memberName || !amount || !username) return;

        await jarService.addMember(id, { name: memberName, amount, username });
        fetchTransactions();
        fetchJar();
        setAmount('');
    };

    const handleRemoveMoney = async () => {
        if (!id || !memberName || !amount || !username) return;

        await jarService.removeMember(id, { name: memberName, amount, username });
        fetchTransactions();
        fetchJar();
        setAmount('');
    };

    
    const handleAddPermission = async (userId: string) => {
        if (!id || !userId) {
            setMessage("Please select a user.");
            return;
        }
        try {
            await jarService.addPermission(id, userId);
            fetchJar();
            setMessage("Permission added successfully!");
        } catch (error: any) {
             setMessage(error.response?.data?.message || "Failed to add permission.");
            console.error("Error adding permission:", error);
        }
    };

    const handleRemovePermission = async (userId: string) => {
      if (!id || !userId) {
            setMessage("Please select a user.");
            return;
        }
        try {
            await jarService.removePermission(id, userId);
            fetchJar();
            setMessage(" Permission removed successfully!");
        } catch (error: any) {
           setMessage(error.response?.data?.message || "Failed to remove permission.");
            console.error("Error removing permission:", error);
        }
    };

    if (!jar) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h2>{jar.name}</h2>
            <p>Swear Jar ID: {jar._id}</p>

            <h3>Members</h3>
            <ul>
                {jar.members.map((member: Member) => (
                    <li key={member.name}>
                        {member.name}: ${member.amount}
                    </li>
                ))}
            </ul>
            <div>
                <h3>Transactions</h3>
                {transactionList}
            </div>
            <div>
                <h3>Add/Remove Money</h3>
                <input
                    type="text"
                    placeholder="Member Name"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
                <button onClick={handleAddMoney}>Add Money</button>
                <button onClick={handleRemoveMoney}>Remove Money</button>
            </div>
            <div>
                <h3>Manage Permissions</h3>
                {message && <p>{message}</p>} {/* Display feedback messages */}
                {/* Display current permissions */}
                {jar.permissions && jar.permissions.length > 0 && (
                    <div>
                        <h4>Current Permissions:</h4>
                        <ul>
                            {jar.permissions.map(permission => (
                                <li key={permission.userId}>
                                    {users.find(user => user._id === permission.userId)?.username || 'Unknown User'}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                 {/* User Selection and Permission Buttons */}
                <div>
                    <label htmlFor="userSelect">Select User:</label>
                    <select id="userSelect" onChange={(e) => setSelectedUserId(e.target.value)}>
                        <option value="">-- Select a user --</option>
                        {users.map(user => (
                            <option key={user._id} value={user._id}>{user.username}</option>
                        ))}
                    </select>
                </div>
                <button onClick={() => handleAddPermission(selectedUserId || "")}>Add Permission</button>
                <button onClick={() => handleRemovePermission(selectedUserId || "")}>Remove Permission</button>
            </div>
        </div>
    );
};

export default SwearJarDetails;