import React, { useState } from "react";
import { XMarkIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function ForwardModal({ contacts, onForward, onClose }) {
    const [search, setSearch] = useState("");

    const filteredContacts = contacts.filter((c) =>
        (c.name || "").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-75 p-4">
            <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl overflow-hidden text-black dark:text-white shadow-2xl flex flex-col max-h-[80vh]">
                <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center">
                    <h3 className="font-semibold text-lg">Forward to...</h3>
                    <XMarkIcon className="w-6 h-6 cursor-pointer" onClick={onClose} />
                </div>

                <div className="p-3 border-b dark:border-gray-800 relative">
                    <MagnifyingGlassIcon className="w-5 h-5 absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl py-2 pl-10 pr-4 outline-none text-sm"
                        placeholder="Search contacts"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex-grow overflow-y-auto">
                    {filteredContacts.length > 0 ? (
                        filteredContacts.map((contact) => (
                            <div
                                key={contact._id || contact.id}
                                onClick={() => onForward(contact)}
                                className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                            >
                                {contact.avatar ? (
                                    <img
                                        src={contact.avatar}
                                        alt={contact.name}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                                        {(contact.name || "U")[0]}
                                    </div>
                                )}
                                <div className="flex-grow">
                                    <p className="font-medium text-sm">{contact.name}</p>
                                    <p className="text-xs text-gray-500">{contact.phone}</p>
                                </div>
                                <div className="text-blue-500 text-sm font-semibold">Send</div>
                            </div>
                        ))
                    ) : (
                        <p className="p-4 text-center text-gray-500 text-sm">No contacts found</p>
                    )}
                </div>
            </div>
        </div>
    );
}
