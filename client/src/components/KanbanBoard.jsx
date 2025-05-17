import React, { useState, useEffect } from "react";
import { FiPlus, FiTrash, FiClock, FiFlag, FiUser, FiAlertCircle, FiCheckCircle, FiX, FiInfo } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { FaFire } from "react-icons/fa";
import { useTask } from "../context/TaskContext";
import { useAuth } from "../context/AuthContext";
import '../styles/kanban.css';

const KanbanBoard = ({ initialTasks = [], projectId = null }) => {
  const { user } = useAuth();
  // We don't need to destructure useTask hooks here as they're used in child components
  
  // Convert initialTasks to the format needed for the Kanban board
  const formatInitialTasks = () => {
    const formattedTasks = initialTasks.map(task => {
      // Ensure task has all required properties
      if (!task) return null;
      
      return {
        id: task._id || task.id,
        title: task.title || 'Untitled Task',
        column: task.status === 'in-progress' ? 'doing' : 
                task.status === 'completed' ? 'done' : 
                task.status === 'review' ? 'review' : 
                task.status === 'backlog' ? 'backlog' : 'todo',
        priority: task.priority || 'medium',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : null,
        assignedTo: task.assignedTo || [],
        createdBy: task.createdBy || user?._id,
        description: task.description || '',
        project: task.project || projectId, // Ensure project reference is maintained
        originalTask: task // Store the original task object for reference
      };
    }).filter(task => task !== null); // Remove any null tasks
    
    return formattedTasks;
  };

  const [cards, setCards] = useState(initialTasks.length > 0 ? formatInitialTasks() : []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    type: 'info', // 'info', 'success', 'error'
    message: ''
  });
  
  // Update cards when initialTasks changes
  useEffect(() => {
    // Always update cards, even if initialTasks is empty
    setCards(initialTasks.length > 0 ? formatInitialTasks() : []);
  }, [initialTasks]);
  
  // The parent component (Dashboard) is responsible for setting the current project
  
  // Show message if no project is selected
  if (!projectId) {
    return (
      <div className="text-center py-8 text-white/60 w-full">
        <p className="text-lg mb-3">Please select a project to view and manage tasks</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center relative">
      {/* Notification */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 ${
              notification.type === 'error' ? 'bg-red-500/90' : 
              notification.type === 'success' ? 'bg-green-500/90' : 
              'bg-blue-500/90'
            }`}
          >
            {notification.type === 'error' && <FiAlertCircle className="text-white" size={20} />}
            {notification.type === 'success' && <FiCheckCircle className="text-white" size={20} />}
            {notification.type === 'info' && <FiInfo className="text-white" size={20} />}
            <p className="text-white">{notification.message}</p>
            <button 
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
              className="ml-2 text-white/80 hover:text-white"
            >
              <FiX size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="kanban-container flex w-full gap-3 overflow-x-auto pb-4 pt-2">
        <Column
          title="Backlog"
          column="backlog"
          headingColor="text-neutral-400"
          cards={cards}
          setCards={setCards}
        />
        <Column
          title="To Do"
          column="todo"
          headingColor="text-yellow-300"
          cards={cards}
          setCards={setCards}
        />
        <Column
          title="In Progress"
          column="doing"
          headingColor="text-blue-300"
          cards={cards}
          setCards={setCards}
        />
        <Column
          title="Review"
          column="review"
          headingColor="text-purple-300"
          cards={cards}
          setCards={setCards}
        />
        <Column
          title="Complete"
          column="done"
          headingColor="text-emerald-300"
          cards={cards}
          setCards={setCards}
        />
      </div>
      
      {/* Show message when there are no tasks */}
      {cards.length === 0 && (
        <div className="text-center py-8 text-white/60 w-full">
          <p className="text-lg mb-3">No tasks found for this project</p>
          <p className="text-sm">Use the "Add task" buttons in each column to create new tasks</p>
        </div>
      )}
      
      <BurnBarrel cards={cards} setCards={setCards} setNotification={setNotification} />
    </div>
  );
};

const Column = ({ title, headingColor, cards, column, setCards }) => {
  const [active, setActive] = useState(false);
  const { updateTask, updateProjectProgress, canManageTask } = useTask();

  const handleDragStart = (e, card) => {
    // Only allow drag if user can manage the task
    if (card.originalTask && !canManageTask(card.originalTask)) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("cardId", card.id);
  };

  const handleDragEnd = async (e) => {
    const cardId = e.dataTransfer.getData("cardId");
    setActive(false);
    clearHighlights();
    const indicators = getIndicators();
    const { element } = getNearestIndicator(e, indicators);
    const before = element.dataset.before || "-1";
    
    if (before !== cardId) {
      let copy = [...cards];
      let cardToTransfer = copy.find((c) => c.id === cardId);
      if (!cardToTransfer) return;
      
      // Map column names to status values for the backend
      const columnToStatus = {
        'todo': 'todo',
        'doing': 'in-progress',
        'review': 'review',
        'done': 'completed',
        'backlog': 'backlog'
      };
      
      // Update the card's column in the UI
      const updatedCard = { ...cardToTransfer, column };
      copy = copy.filter((c) => c.id !== cardId);
      const moveToBack = before === "-1";
      
      if (moveToBack) {
        copy.push(updatedCard);
      } else {
        const insertAtIndex = copy.findIndex((el) => el.id === before);
        if (insertAtIndex === undefined) return;
        copy.splice(insertAtIndex, 0, updatedCard);
      }
      
      setCards(copy);
      
      // Update the task status in the backend
      if (cardToTransfer.originalTask) {
        try {
          // Update task status
          await updateTask(cardToTransfer.id, {
            status: columnToStatus[column]
          });
          
          // Update project progress
          if (cardToTransfer.project) {
            try {
              const projectId = typeof cardToTransfer.project === 'object' 
                ? cardToTransfer.project._id || cardToTransfer.project.id
                : cardToTransfer.project;
                
              if (projectId) {
                // Use the context function to update project progress
                await updateProjectProgress(projectId);
                console.log(`Updated progress for project ${projectId}`);
              } else {
                console.warn('Invalid project ID found in task');
              }
            } catch (progressError) {
              console.error('Error updating project progress:', progressError);
            }
          }
        } catch (error) {
          console.error('Failed to update task status:', error);
          // Revert the UI change if the API call fails
          setCards(cards);
        }
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    highlightIndicator(e);
    setActive(true);
  };

  const clearHighlights = (els) => {
    const indicators = els || getIndicators();
    indicators.forEach((i) => {
      i.style.opacity = "0";
    });
  };

  const highlightIndicator = (e) => {
    const indicators = getIndicators();
    clearHighlights(indicators);
    const el = getNearestIndicator(e, indicators);
    el.element.style.opacity = "1";
  };

  const getNearestIndicator = (e, indicators) => {
    const DISTANCE_OFFSET = 50;
    const el = indicators.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = e.clientY - (box.top + DISTANCE_OFFSET);
        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      },
      {
        offset: Number.NEGATIVE_INFINITY,
        element: indicators[indicators.length - 1],
      }
    );
    return el;
  };

  const getIndicators = () => {
    return Array.from(document.querySelectorAll(`[data-column="${column}"]`));
  };

  const handleDragLeave = () => {
    clearHighlights();
    setActive(false);
  };

  const filteredCards = cards.filter((c) => c.column === column);

  return (
    <div className="w-72 shrink-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className={`font-medium ${headingColor}`}>{title}</h3>
        <span className="rounded bg-white/10 px-2 py-0.5 text-sm text-white/70">
          {filteredCards.length}
        </span>
      </div>
      <div
        onDrop={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`kanban-column min-h-[450px] w-full rounded-xl transition-colors ${
          active ? "column-active bg-white/10" : "bg-white/5"
        } border border-white/10 p-4`}
      >
        <AnimatePresence>
          {filteredCards.map((c) => {
            return <Card key={c.id} {...c} handleDragStart={handleDragStart} />;
          })}
        </AnimatePresence>
        <DropIndicator beforeId={null} column={column} />
        <AddCard column={column} setCards={setCards} />
      </div>
    </div>
  );
};

const Card = ({ title, id, column, priority, dueDate, assignedTo, originalTask, handleDragStart }) => {
  const { canManageTask, canEditTask } = useTask();
  const canManage = originalTask ? canManageTask(originalTask) : true;
  const canEdit = originalTask ? canEditTask(originalTask) : true;
  
  return (
    <>
      <DropIndicator beforeId={id} column={column} />
      <motion.div
        layout
        layoutId={id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        draggable={canManage ? "true" : "false"}
        onDragStart={(e) => handleDragStart(e, { title, id, column, priority, dueDate, assignedTo, originalTask })}
        className={`kanban-card rounded-lg border border-white/10 bg-white/5 p-3 transition-all mb-2 ${
          canManage ? "cursor-grab active:cursor-grabbing hover:bg-white/10" : "cursor-default opacity-80"
        }`}
        whileHover={canManage ? { scale: 1.02 } : {}}
        data-card-id={id}
        data-can-edit={canEdit.toString()}
        data-can-manage={canManage.toString()}
        data-original-task={originalTask ? JSON.stringify(originalTask) : '{}'}
      >
        <p className="text-sm text-white mb-2 font-robert-medium">{title}</p>
        
        {/* Task metadata */}
        <div className="flex flex-wrap justify-between items-center text-xs gap-2">
          {priority && (
            <span className={`px-2 py-0.5 rounded-lg flex items-center gap-1 ${
              priority === 'high' ? 'priority-high' :
              priority === 'medium' ? 'priority-medium' :
              'priority-low'
            }`}>
              <FiFlag className="inline" size={10} />
              {priority}
            </span>
          )}
          
          {dueDate && (
            <span className="text-white/60 flex items-center gap-1">
              <FiClock className="inline" size={10} />
              {dueDate}
            </span>
          )}
        </div>
        
        {/* Assigned users */}
        {assignedTo && assignedTo.length > 0 && (
          <div className="mt-2 flex items-center gap-1">
            <FiUser className="text-white/60" size={10} />
            <span className="text-white/60 text-xs">
              {assignedTo.length === 1 
                ? assignedTo[0].name || 'Assigned'
                : `${assignedTo.length} assignees`}
            </span>
          </div>
        )}
        
        {/* Permission indicator */}
        {originalTask && (
          <div className="mt-2 text-xs">
            {!canManage && (
              <span className="text-white/40">View only</span>
            )}
            {canManage && !canEdit && (
              <span className="text-blue-300/60">Can update status</span>
            )}
          </div>
        )}
      </motion.div>
    </>
  );
};

const DropIndicator = ({ beforeId, column }) => {
  return (
    <div
      data-before={beforeId || "-1"}
      data-column={column}
      className="drop-indicator my-0.5 h-0.5 w-full bg-violet-400 opacity-0"
    />
  );
};



const AddCard = ({ column, setCards }) => {
  const [text, setText] = useState("");
  const [description, setDescription] = useState("");
  const [adding, setAdding] = useState(false);
  const [priority, setPriority] = useState("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignees, setAssignees] = useState([]);
  const { createTask, currentProject, projects, userRoles } = useTask();
  const { user } = useAuth();

  // Map column names to status values for the backend
  const columnToStatus = {
    'todo': 'todo',
    'doing': 'in-progress',
    'review': 'review',
    'done': 'completed',
    'backlog': 'backlog'
  };
  
  // Check if user is owner or admin of the current project
  const canAssignToOthers = () => {
    if (!currentProject || !projects.length) return false;
    
    const currentProjectObj = projects.find(p => 
      (p._id === currentProject || p.id === currentProject)
    );
    
    if (!currentProjectObj) return false;
    
    // Check if user is in the team with owner or admin role
    const userTeamMember = currentProjectObj.team?.find(member => {
      const memberId = member.user?._id || member.user;
      return memberId === user?._id;
    });
    
    return userTeamMember && ['owner', 'admin'].includes(userTeamMember.role);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim().length) return;
    
    // Check if a project is selected
    if (!currentProject) {
      alert('Please select a project before creating a task');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create task in the backend
      const taskData = {
        title: text.trim(),
        description: description.trim() || text.trim(),
        status: columnToStatus[column],
        priority: priority,
        dueDate: new Date().toISOString(),
        assignedTo: assignees.length > 0 ? assignees : (user ? [user._id] : []) // Use selected assignees or default to current user
      };
      
      const createdTask = await createTask(currentProject, taskData);
      
      if (!createdTask) {
        throw new Error('Failed to create task - no task returned from API');
      }
      
      // Add the new card to the UI
      const newCard = {
        column,
        title: text.trim(),
        id: createdTask._id,
        priority: priority,
        dueDate: new Date().toISOString().split('T')[0],
        assignedTo: createdTask.assignedTo || [],
        createdBy: user ? user._id : null,
        description: description.trim() || text.trim(),
        originalTask: createdTask
      };
      
      setCards((pv) => [...pv, newCard]);
      setText("");
      setDescription("");
      setAssignees([]);
      setAdding(false);
      
      // Show success notification
      setNotification({
        type: 'success',
        message: 'Task created successfully',
        show: true
      });
      
      // Auto-hide notification after 3 seconds
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 3000);
    } catch (error) {
      console.error('Failed to create task:', error);
      
      // Show error notification instead of alert
      setNotification({
        type: 'error',
        message: error.message || 'Failed to create task. Please try again.',
        show: true
      });
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {adding ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="mt-2"
        >
          <motion.form layout onSubmit={handleSubmit}>
            <input
              type="text"
              onChange={(e) => setText(e.target.value)}
              value={text}
              autoFocus
              placeholder="Task title..."
              className="w-full rounded border border-violet-400 bg-violet-400/10 p-3 text-sm text-white placeholder-violet-300 focus:outline-none mb-2"
            />
            
            <textarea
              onChange={(e) => setDescription(e.target.value)}
              value={description}
              placeholder="Description (optional)"
              className="w-full rounded border border-violet-400/50 bg-violet-400/5 p-3 text-sm text-white placeholder-violet-300/70 focus:outline-none"
              rows={3}
            />
            
            <div className="mt-3 mb-2">
              <label className="text-xs text-white/70 block mb-1">Priority:</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPriority("low")}
                  className={`px-2 py-1 text-xs rounded ${
                    priority === "low" 
                      ? "bg-green-500/30 text-green-300 ring-1 ring-green-500" 
                      : "bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  Low
                </button>
                <button
                  type="button"
                  onClick={() => setPriority("medium")}
                  className={`px-2 py-1 text-xs rounded ${
                    priority === "medium" 
                      ? "bg-yellow-500/30 text-yellow-300 ring-1 ring-yellow-500" 
                      : "bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  Medium
                </button>
                <button
                  type="button"
                  onClick={() => setPriority("high")}
                  className={`px-2 py-1 text-xs rounded ${
                    priority === "high" 
                      ? "bg-red-500/30 text-red-300 ring-1 ring-red-500" 
                      : "bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  High
                </button>
              </div>
            </div>
            
            {/* Assignee selection - only shown for team owners/admins */}
            {canAssignToOthers() && (
              <div className="mt-3 mb-2">
                <label className="text-xs text-white/70 block mb-1">Assign to:</label>
                <div className="flex flex-col gap-1 bg-white/5 p-2 rounded">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="assign-self"
                      checked={assignees.includes(user?._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAssignees(prev => [...prev, user._id]);
                        } else {
                          setAssignees(prev => prev.filter(id => id !== user._id));
                        }
                      }}
                      className="h-3 w-3 rounded border-white/30 bg-white/5"
                    />
                    <label htmlFor="assign-self" className="text-xs text-white/80">
                      Myself
                    </label>
                  </div>
                  
                  {/* Get team members from current project */}
                  {currentProject && projects.length > 0 && (
                    <>
                      {(() => {
                        const currentProjectObj = projects.find(p => 
                          (p._id === currentProject || p.id === currentProject)
                        );
                        
                        if (currentProjectObj?.team?.length > 0) {
                          return (
                            <div className="mt-2">
                              <div className="text-xs text-white/80 mb-1">Team members:</div>
                              {currentProjectObj.team.map(member => {
                                // Skip if it's the current user (already handled above)
                                const memberId = member.user?._id || member.user;
                                if (memberId === user?._id) return null;
                                
                                const memberName = member.user?.name || 'Team member';
                                
                                return (
                                  <div key={memberId} className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id={`member-${memberId}`}
                                      checked={assignees.includes(memberId)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setAssignees(prev => [...prev, memberId]);
                                        } else {
                                          setAssignees(prev => prev.filter(id => id !== memberId));
                                        }
                                      }}
                                      className="h-3 w-3 rounded border-white/30 bg-white/5"
                                    />
                                    <label htmlFor={`member-${memberId}`} className="text-xs text-white/80">
                                      {memberName}
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }
                        
                        return (
                          <div className="text-xs text-white/60 mt-1">
                            No other team members found in this project.
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>
              </div>
            )}
            
            <div className="mt-1.5 flex items-center justify-end gap-1.5">
              <button
                onClick={() => setAdding(false)}
                className="px-3 py-1.5 text-xs text-white/60 transition-colors hover:text-white"
                type="button"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                type="submit"
                disabled={isSubmitting || !text.trim()}
                className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs text-white transition-colors ${
                  isSubmitting || !text.trim() 
                    ? "bg-violet-500/50 cursor-not-allowed" 
                    : "bg-violet-500 hover:bg-violet-600"
                }`}
              >
                <span>{isSubmitting ? "Adding..." : "Add"}</span>
                {!isSubmitting && <FiPlus />}
              </motion.button>
            </div>
          </motion.form>
        </motion.div>
      ) : (
        <motion.button
          layout
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setAdding(true)}
          className="add-task-btn flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white mt-2"
        >
          <span>Add task</span>
          <FiPlus />
        </motion.button>
      )}
    </>
  );
};

// No default cards - we'll use real data from the backend

const BurnBarrel = ({ cards, setCards, setNotification }) => {
  const [active, setActive] = useState(false);
  const { deleteTask, canEditTask } = useTask();

  const handleDragOver = (e) => {
    e.preventDefault();
    setActive(true);
  };

  const handleDragLeave = () => {
    setActive(false);
  };

  const handleDragEnd = async (e) => {
    const cardId = e.dataTransfer.getData("cardId");
    if (!cardId) {
      setActive(false);
      return;
    }
    
    try {
      // Find the card in our state to get the original task
      const cardsState = [...cards]; // Make a copy of current cards state
      // Look for the card with matching id, handling different ID formats
      const cardToDelete = cardsState.find(c => 
        c.id === cardId || 
        (c.originalTask && (c.originalTask._id === cardId || c.originalTask.id === cardId))
      );
      
      if (cardToDelete) {
        const taskToDelete = cardToDelete.originalTask;
        
        // Check if user can edit this task
        if (taskToDelete && !canEditTask(taskToDelete)) {
          setActive(false);
          return;
        }
        
        // Remove from UI first for better UX
        // Filter using the same logic as our find operation to ensure consistency
        setCards(cardsState.filter(c => 
          c.id !== cardId && 
          !(c.originalTask && (c.originalTask._id === cardId || c.originalTask.id === cardId))
        ));
        
        // Then delete from backend if it exists there
        if (taskToDelete) {
          const taskId = taskToDelete?._id || taskToDelete?.id || cardId;
          try {
            await deleteTask(taskId);
            
            // Show success notification
            setNotification({
              type: 'success',
              message: 'Task deleted successfully',
              show: true
            });
            
            // Auto-hide notification after 3 seconds
            setTimeout(() => {
              setNotification(prev => ({ ...prev, show: false }));
            }, 3000);
          } catch (error) {
            console.error('Failed to delete task:', error);
            
            // If deletion failed, we should add the card back to the UI
            setCards(prevCards => [...prevCards, cardToDelete]);
            
            // Show a more user-friendly error message
            const errorMessage = error.message || 'An error occurred while deleting the task. Please try again.';
            
            // Use a more user-friendly notification instead of alert
            setNotification({
              type: 'error',
              message: errorMessage,
              show: true
            });
            
            // Auto-hide notification after 5 seconds
            setTimeout(() => {
              setNotification(prev => ({ ...prev, show: false }));
            }, 5000);
          }
        }
      }
    } catch (error) {
      console.error('Error in handleDragEnd:', error);
    } finally {
      setActive(false);
    }
  };

  return (
    <div
      onDrop={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`mt-10 grid h-56 w-72 shrink-0 place-content-center rounded border text-3xl transition-all duration-300 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 hover:shadow-lg ${
        active
          ? "border-red-800 bg-red-800/20 text-red-500"
          : "border-neutral-500 bg-neutral-500/20 text-neutral-500"
      }`}
    >
      <div className="flex flex-col items-center gap-2">
        {active ? <FaFire className="animate-bounce" /> : <FiTrash />}
        <span className="text-sm font-light opacity-70">{active ? "Release to delete" : "Drag here to delete"}</span>
      </div>
    </div>
  );
};

export default KanbanBoard;