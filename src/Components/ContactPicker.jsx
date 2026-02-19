import React, { useState } from "react";
import { useContacts } from "../ContactContext";
import { AiOutlineClose } from "react-icons/ai";

const ContactPicker = ({ onClose, onSelect }) => {
    const { contacts } = useContacts();
    const [searchTerm, setSearchTerm] = useState("");

    const filteredContacts = contacts.filter((contact) => {
        const name = contact.name || `${contact.firstName || ""} ${contact.lastName || ""}`.trim();
        return name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg w-80 h-96 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-black dark:text-white">Share Contact</h2>
                    <AiOutlineClose
                        className="cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        onClick={onClose}
                    />
                </div>

                <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 mb-4 rounded bg-gray-100 dark:bg-neutral-700 text-black dark:text-white"
                />

                <div className="flex-1 overflow-y-auto space-y-2">
                    {filteredContacts.length === 0 ? (
                        <p className="text-center text-gray-500 mt-4">No contacts found</p>
                    ) : (
                        filteredContacts.map((contact) => (
                            <div
                                key={contact._id || contact.id}
                                onClick={() => onSelect(contact)}
                                className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg cursor-pointer"
                            >
                                {contact.avatar ? (
                                    <img
                                        src={contact.avatar}
                                        alt={contact.name}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                                        {(contact.name || contact.firstName || "?")[0]}
                                    </div>
                                )}
                                <div>
                                    <p className="font-medium text-black dark:text-white text-sm">
                                        {contact.name || `${contact.firstName || ""} ${contact.lastName || ""}`}
                                    </p>
                                    <p className="text-xs text-gray-500">{contact.phone}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContactPicker;
