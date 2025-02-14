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

const SwearJarDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [jar, setJar] = useState<any>(null);
    const [password, setPassword] = useState('');
    const [memberName, setMemberName] = useState('');
    const [amount, setAmount] = useState('');
    const [username, setUsername] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
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

    // useEffect(() => {
    //     return () => {
    //       console.log("Component unmounted, disconnecting socket");
    //       socket.disconnect();
    //     };
    //   }, [socket]);

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
        if (!id || !password || !memberName || !amount || !username) return;

        await jarService.addMember(id, { password, name: memberName, amount, username });
        fetchTransactions();
        fetchJar();
        setAmount('');
    };

    const handleRemoveMoney = async () => {
        if (!id || !password || !memberName || !amount || !username) return;

        await jarService.removeMember(id, { password, name: memberName, amount, username });
        fetchTransactions();
        fetchJar();
        setAmount('');
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
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
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
        </div>
    );
};

export default SwearJarDetails;