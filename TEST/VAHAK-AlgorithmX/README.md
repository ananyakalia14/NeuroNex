<img width="901" height="583" alt="image" src="https://github.com/user-attachments/assets/29938b4f-602d-46ee-a97c-0925292eb9d1" />




🚑 VAHAK AlgorithmX

<div align="center">

VAHAK 3D Command Center

Intelligent Rural Healthcare Dispatch, Routing & Resource Optimization

A real-time algorithmic healthcare logistics platform for emergency routing, ambulance dispatch, hospital allocation, medicine-aware decision making, and dynamic road-network optimization.

Hackathon Focus: deterministic graph algorithms + real healthcare constraints + real-road routing + realtime backend + explainable AI.







</div>


1. Project Overview


The Problem

Rural healthcare networks operate with limited ambulances, specialists, hospital beds, medicines, and reliable transportation infrastructure.

During simultaneous emergencies, the nearest hospital is not always the correct destination.

For example:

Village A
   │
   │ Critical Cardiology Emergency
   ▼
Hospital B ── 10 km ── ❌ Cardiologist unavailable

Hospital C ── 25 km ── ✅ Cardiologist available
                         ✅ Bed available
                         ✅ Medicine available

VAHAK AlgorithmX evaluates the complete operational state before dispatching an ambulance.

The system considers:

Emergency urgency and priority

Patient waiting time

Specialist availability and duty status

Hospital bed capacity

Medicine inventory

Ambulance availability and capability

Actual road connectivity

Dynamic road closures and road conditions

Travel time and ETA

SLA / time-window constraints

Resource conflicts between simultaneous emergencies

The key design principle is:

Distance is a factor, not the decision. Medical eligibility, resource availability, urgency, and a valid road path determine the dispatch.

Primary objective

Minimize:

Travel Time
+
Patient Wait Time
+
Resource / Constraint Penalty

while preserving emergency priority and medical eligibility.


2. Project Context
   

Demo Network

DHARNAI RURAL HEALTH NETWORK • JEHANABAD, BIHAR (NH-83)

The current prototype uses this location as the geographic context for the simulation.

The demo network is designed around:

50 Rural Villages
10 Hospitals
50 Ambulances

The architecture is designed toward the larger challenge benchmark of:

50,000+ Graph Nodes
200,000+ Weighted Road Edges
5,000+ Villages / Health Points
Thousands of Concurrent Emergency Requests
Dynamic Road Closures
Strict Urgency and SLA Constraints


3. Key Features


🗺️ Real Road-Based Routing

Routing Integrity

The routing layer is designed to prevent visually convincing but operationally invalid paths. A route is considered valid only when it can be represented as a connected sequence of traversable road edges between the source and destination.

VAHAK does not intentionally draw optimistic straight-line routes across farms, fields, buildings, rivers, or inaccessible terrain.

Routes are calculated over a connected road network.

Emergency Location
       ↓
Nearest Valid Road
       ↓
Road Segment
       ↓
Junction
       ↓
Road Segment
       ↓
Bridge / Connected Road
       ↓
Hospital

The route shown to the operator should correspond to the actual available road path, while preserving the road geometry used by the map and dispatch visualization.

If no valid connected road route exists:

NO VALID ROAD ROUTE AVAILABLE

The system must not invent a straight-line fallback.

⭐ A* Routing

Why A*?

A* is selected as the primary routing algorithm because the geographic heuristic can guide the search toward the destination while avoiding unnecessary exploration of the full road graph. This is particularly useful when the network contains tens of thousands of nodes and hundreds of thousands of weighted edges.

A* is the primary shortest-path algorithm.

f(n) = g(n) + h(n)

Where:

g(n) = accumulated travel cost

h(n) = geographic heuristic

f(n) = estimated total route cost

A* operates on a road graph represented using adjacency lists.

🔎 Dijkstra

Why Dijkstra?

Dijkstra provides a reliable baseline for shortest-path calculation when all edge weights are non-negative. Running A* and Dijkstra against the same graph and cost model also gives the project a useful benchmark for comparing search efficiency.

Dijkstra operates on the same road graph and is used for:

shortest-path comparison

deterministic routing

algorithm benchmarking

validating A* results

Blocked road edges are excluded from traversal.

⚡ Priority Queue

Emergency Scheduling

The queue ensures that high-risk emergencies are not delayed simply because another request arrived earlier. The queue is integrated with the dispatch service rather than being treated as an isolated data-structure demonstration.

Emergency requests are managed through a priority queue.

Priority order:

CRITICAL
   ↓
HIGH
   ↓
MEDIUM
   ↓
LOW

For requests with equal urgency, the system can consider:

SLA remaining

Deadline

Waiting time

Target queue complexity:

Push → O(log n)
Pop  → O(log n)
Peek → O(1)

🚑 Ambulance Allocation

Dispatch Constraints

An ambulance is considered only when it can satisfy the emergency's operational requirements. The nearest ambulance by straight-line distance is not automatically selected.

The dispatch engine evaluates available ambulances based on:

Current location

Road travel time

ETA

Availability

Vehicle type

Required equipment

Current workload

A representative dispatch score is:

Ambulance Cost =
ETA to Patient
+
ETA to Hospital
+
Availability Penalty

Emergency urgency remains the highest-level constraint.

🏥 Hospital Selection

Eligibility Before Optimization

Hospital filtering happens before route optimization whenever possible. This reduces unnecessary graph searches and prevents the routing engine from spending time optimizing a destination that cannot safely receive the patient.

Hospitals are filtered before route optimization.

Possible eligibility conditions:

Required Specialist Available
        +
Specialist On Duty
        +
Bed Available
        +
Required Medicine Available
        +
Hospital Operational
        +
Valid Road Route
        +
SLA Feasible

This prevents the system from selecting a nearby but medically unsuitable facility.

💊 Medicine & 🛏️ Bed Allocation

Consistent Resource State

Healthcare resources are treated as shared state. Reservations must therefore be performed safely when multiple emergencies are processed at the same time.

A successful dispatch can reserve:

Ambulance
+
Hospital Bed
+
Required Medicine

Resource reservation should be transaction-safe so that simultaneous emergency requests cannot reserve the same unavailable resource.

🚧 Dynamic Road Closures

Incremental Re-Routing

Road closures are treated as graph-state changes rather than cosmetic map events. When a traversable edge becomes blocked, the routing layer can invalidate the affected path and search for another valid path.

When a road becomes blocked:

ROAD OPEN
   ↓
ROAD BLOCKED
   ↓
Affected Route Invalidated
   ↓
Road Graph Updated
   ↓
A* Recalculation
   ↓
Alternative Valid Route
   ↓
ETA Updated
   ↓
Ambulance Route Updated

This allows the command center to react to changing road conditions.

Decision Logic at a Glance

                EMERGENCY RECEIVED
                        ↓
              Assign urgency / SLA
                        ↓
                PRIORITY QUEUE
                        ↓
              Candidate hospitals
                        ↓
        ┌───────────────┴────────────────┐
        ↓                                ↓
 Specialist / bed /              Medicine / status
 operational checks                  checks
        └───────────────┬────────────────┘
                        ↓
               Eligible hospitals
                        ↓
               Available ambulances
                        ↓
               REAL ROAD GRAPH
                        ↓
                 A* / Dijkstra
                        ↓
                Feasible options
                        ↓
              Cost + SLA comparison
                        ↓
             Transactional reservation
                        ↓
                  DISPATCH
                        ↓
             Realtime monitoring
                        ↓
              Road/event change?
                  ↙           ↘
                NO             YES
                 ↓              ↓
              Continue       Re-route



4. System Architecture
   

                         ┌─────────────────────┐
                         │    EXISTING UI      │
                         │ React / Vite / 3D   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   SERVICE LAYER     │
                         │ Emergency / Dispatch│
                         └──────────┬──────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 ▼                  ▼                  ▼
          ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
          │  Priority   │   │ Eligibility │   │  Resource   │
          │    Queue    │   │   Engine    │   │ Allocation  │
          └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
                 │                  │                  │
                 └──────────────────┼──────────────────┘
                                    ▼
                         ┌─────────────────────┐
                         │   ROUTING ENGINE    │
                         │     A* / Dijkstra   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   REAL ROAD GRAPH   │
                         │ Nodes + Road Edges  │
                         │ Traffic + Closures  │
                         └──────────┬──────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 ▼                  ▼                  ▼
          ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
          │ Google Maps │   │  Supabase   │   │  Realtime   │
          │ / Geometry  │   │ PostgreSQL  │   │   Events    │
          └─────────────┘   └─────────────┘   └─────────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │  CANONICAL ROUTE    │
                         │ Map + 3D + Dispatch │
                         └─────────────────────┘


6. Technology Stack


The stack separates presentation, realtime data, deterministic algorithms, geospatial services, and AI-assisted explanation so that failure of one optional service does not unnecessarily disable the core dispatch engine.

Layer

Technology

Purpose

Frontend

React

Interactive command-center interface

Build Tool

Vite

Fast development and production builds

Styling

Existing project UI system

Command-center visual interface

Database

Supabase PostgreSQL

Persistent operational data

Realtime

Supabase Realtime

Live emergency, ambulance and resource updates

Maps

Google Maps Platform

Geographic visualization and road-aware mapping

Routing

A*

Primary graph shortest-path algorithm

Routing

Dijkstra

Shortest-path comparison and benchmarking

Data Structure

Priority Queue / Binary Heap

Emergency scheduling

AI Layer

AI API / configured provider

Decision explanation and operational intelligence

Language

Project source language / TypeScript where configured

Application and algorithm implementation

6. Algorithm and Approach

The implementation follows a filter → route → score → reserve → dispatch → monitor → reroute strategy. This prevents expensive routing work from being performed for obviously ineligible destinations and makes each decision explainable to the operator.

Emergency Dispatch Pipeline

1. Receive Emergency
        ↓
2. Assign Urgency
        ↓
3. Insert into Priority Queue
        ↓
4. Find Eligible Hospitals
        ↓
5. Filter by Specialist / Bed / Medicine
        ↓
6. Find Compatible Ambulances
        ↓
7. Build / Query Road Graph
        ↓
8. Run A* / Dijkstra
        ↓
9. Compare Feasible Dispatch Options
        ↓
10. Reserve Resources
        ↓
11. Dispatch Ambulance
        ↓
12. Stream State Updates
        ↓
13. Reroute if Road Conditions Change

Road Graph

Graph Integrity

The road graph is the source of truth for algorithmic route traversal. Geographic proximity alone must not create an edge between two locations.

Road Graph

The graph uses an adjacency-list representation.

Node

nodeId
latitude
longitude
nodeType

Edge

edgeId
fromNode
toNode
distance
travelTime
traffic
roadCondition
blocked
geometry

This prevents the routing engine from treating geographic distance as if it were a drivable road.

A* Heuristic

For geographically distributed nodes, the heuristic estimates remaining travel cost between the current node and destination.

The heuristic must remain consistent with the selected edge cost model.

For a time-based route:

g(n) = accumulated travel time
h(n) = estimated remaining travel time

For a distance-based route:

g(n) = accumulated distance
h(n) = estimated remaining distance

7. Testing & Test Cases

Testing focuses on both algorithm correctness and operational edge cases. A successful test should verify not only that a result is produced, but that the result respects medical, resource, and road-network constraints.

The project must validate both normal and failure scenarios.

Test Case 01 — Specialist Unavailable

Input:
Nearest hospital has no required specialist.

Expected:
Hospital rejected.
Next medically eligible hospital evaluated.

Test Case 02 — Hospital Bed Full

Input:
Hospital has the required specialist but no available bed.

Expected:
Hospital rejected.
Another eligible facility evaluated.

Test Case 03 — Medicine Depleted

Input:
Required medicine inventory is zero.

Expected:
Hospital rejected or medicine replenishment workflow triggered,
depending on the configured business rule.

Test Case 04 — All Ambulances Occupied

Input:
No compatible ambulance is currently available.

Expected:
Emergency remains queued with high priority.
System monitors fleet state.
Dispatch occurs when a compatible ambulance becomes available.

Test Case 05 — Road Closure

Input:
Active route contains a newly blocked road edge.

Expected:
Current route invalidated.
A* recalculates.
Alternative connected road route selected.

Test Case 06 — No Valid Route

Input:
No connected road path exists between source and destination.

Expected:
NO VALID ROAD ROUTE AVAILABLE

No straight-line route should be generated.

Test Case 07 — Simultaneous Critical Emergencies

Input:
Multiple CRITICAL requests arrive together.

Expected:
Priority queue processes them according to urgency and
secondary SLA/deadline/wait-time rules.
Resource reservations remain consistent.

Test Case 08 — A* vs Dijkstra

Input:
Same source, destination and road graph.

Expected:
Both algorithms return a valid shortest path under
the same edge-cost model.

Benchmark:
Execution time
Visited nodes
Path cost
Path length

8. Database Architecture

The database acts as the persistent operational state of the platform. Frontend components should consume current state through the application/service layer rather than relying on duplicated hardcoded mock state.

Supabase PostgreSQL stores operational entities such as:

villages
patients
hospitals
hospital_departments
hospital_beds
doctors
doctor_shifts
ambulances
ambulance_equipment
medicines
medicine_inventory
emergencies
road_nodes
road_edges
road_closures
routes
dispatches
dispatch_events
ai_recommendations
audit_logs

Important indexed fields should include:

emergencies.status
emergencies.urgency
emergencies.village_id

ambulances.status

hospitals.status

doctors.specialization

medicine_inventory.hospital_id

road_edges.from_node
road_edges.to_node
road_edges.blocked

dispatches.emergency_id
dispatches.ambulance_id

9. Supabase Configuration

Required Runtime Configuration

The frontend uses Vite environment variables for client-safe configuration. Actual project credentials must be supplied locally or through the deployment platform's secret/environment-variable configuration.

Create a local .env file:

VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

Security

Do not commit .env.

Do not expose:

SUPABASE_SERVICE_ROLE_KEY

in client-side code.

Use Supabase Row Level Security for protected database operations.


10. Realtime Architecture
    

Realtime updates keep the command center synchronized with operational changes without requiring a full-page refresh. The UI should treat database events as state changes and update the corresponding operational views.

Supabase Realtime can synchronize:

Emergencies
Ambulances
Hospitals
Medicine Inventory
Road Closures
Dispatches
Routes

Ambulance State

AVAILABLE
   ↓
ASSIGNED
   ↓
EN_ROUTE
   ↓
ARRIVED
   ↓
TRANSPORTING
   ↓
AVAILABLE

Emergency State

QUEUED
   ↓
DISPATCHING
   ↓
DISPATCHED
   ↓
EN_ROUTE
   ↓
ARRIVED
   ↓
COMPLETED


11. AI Integration


AI Safety Boundary

AI provides interpretation and explanation around deterministic decisions. It should not silently override a verified route, unavailable resource, specialist requirement, or transactional database state.

The AI layer is designed as an assistance and explanation layer.

AI responsibilities

Explain why a hospital was selected

Explain why a hospital was rejected

Summarize route decisions

Identify operational risks

Generate human-readable dispatch reasoning

Summarize simulation outcomes

Deterministic responsibilities

The AI must not be the source of truth for:

A* path calculation

Dijkstra calculation

Emergency priority

Specialist eligibility

Bed availability

Medicine availability

Ambulance availability

Transactional resource reservation

If the AI service is unavailable, the core routing and dispatch engine must continue operating.


12. Third-Party APIs & AI Tools
    

The following external services are used as supporting infrastructure. Core graph decisions remain reproducible from the project's routing graph and operational data.

Tool / API

One-line Purpose

Google Maps Platform

Provides geographic mapping, road-aware visualization and route geometry used by the command center.

Supabase

Provides PostgreSQL database storage, authentication/backend services and realtime synchronization.

Configured AI API

Provides decision explanations, operational summaries and AI-assisted interpretation of deterministic dispatch results.

Keep API keys in environment variables and configure provider-specific restrictions before deployment.


13. Setup / Run Instructions
    

Local Development

Follow the steps below to reproduce the application locally. Ensure the required environment variables are configured before starting the development server.

Clone Repository

git clone https://github.com/AdityaGupta27177/VAHAK-AlgorithmX.git
cd VAHAK-AlgorithmX

Install Dependencies

npm install

Configure Environment

Create:

.env

Example:

VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GOOGLE_MAPS_API_KEY=

Start Development Server

npm run dev

Production Build

npm run build

Preview Production Build

npm run preview


14. Suggested Project Structure
    

The structure keeps algorithmic logic separate from UI components and infrastructure services, making the routing engine easier to test and benchmark independently.

VAHAK-AlgorithmX/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   ├── lib/
│   ├── algorithms/
│   │   ├── astar/
│   │   ├── dijkstra/
│   │   └── priorityQueue/
│   ├── routing/
│   ├── dispatch/
│   └── types/
│
├── supabase/
│   ├── migrations/
│   └── seed/
│
├── public/
│
├── .env.example
├── package.json
├── vite.config.*
└── README.md


15. Demo Workflow


The following workflow demonstrates the central judging scenario: a medically urgent request where the geographically nearest facility is not the correct destination.

Critical Cardiology Request

Village A
   ↓
CRITICAL
   ↓
Cardiology Required
   ↓
Hospital B
10 km
❌ Specialist unavailable
   ↓
Hospital C
25 km
✅ Specialist available
✅ Bed available
✅ Medicine available
   ↓
Find Available Ambulances
   ↓
Calculate Real Road ETA
   ↓
A*
   ↓
Reserve Resources
   ↓
Dispatch

If a road closure occurs:

ACTIVE ROUTE
    ↓
ROAD CLOSED
    ↓
A* RE-ROUTING
    ↓
NEW ROAD PATH
    ↓
UPDATED ETA
    ↓
AMBULANCE CONTINUES


16. Performance Considerations
    

The implementation is designed to keep high-frequency operational work efficient by limiting unnecessary graph searches, using appropriate data structures, and separating realtime updates from computationally expensive routing operations.

The architecture targets efficient operation through:

Adjacency-list graph representation

Binary-heap priority queues

Indexed database queries

Candidate hospital filtering

Route caching where safe

Graph versioning

Incremental route recalculation

Realtime state updates

Separation of deterministic algorithms from AI services

Complexity targets

Priority Queue Insert  → O(log n)
Priority Queue Remove  → O(log n)
Priority Queue Peek    → O(1)

A* and Dijkstra complexity depends on graph representation and priority-queue implementation.


17. Hackathon Edge Cases
    

The following cases directly reflect the challenge requirements and should be demonstrable from the command center during judging.

The system addresses the challenge's critical edge cases:

Edge Case

Expected Behavior

No direct road route

Search alternate connected road path

Specialist unavailable

Reject medically unsuitable hospital

Ambulances occupied

Keep emergency prioritized until compatible resource becomes available

Hospital bed full

Reject or defer facility

Medicine depleted

Reject/defer facility or trigger configured inventory workflow

Road blocked

Invalidate route and recalculate

Multiple critical emergencies

Priority queue + resource-safe allocation

No valid route

Explicitly report no route rather than drawing an imaginary path


18. Submission Checklist
    

This checklist is aligned with the submission protocol shown in the provided hackathon screenshots. It is intended as the final pre-submission verification list.

Based on the required submission protocol:

GitHub Repository

Repository name follows the Team Name requirement

Continue using the project's original repository

Add required collaborators:

Twentrix

AyushRBuilds

InvictusMF

Complete source code is pushed

Repository is accessible to judges

README Requirements

Project overview

Technologies used

Setup / run instructions

Algorithm / approach

Testing / test cases

Third-party APIs with one-line purpose

AI tools with one-line purpose

Verify deployed project link before final submission

Final Verification

README is properly formatted

Algorithm / approach is documented

Testing / test cases are included

Third-party APIs are documented

AI tools are documented

Deployed project link works

Repository link is correct and accessible

All required collaborators are added

Complete source code is pushed

Judge-Facing Summary

VAHAK AlgorithmX is not only a map interface. Its core contribution is the coordination layer behind the interface:

REAL ROAD GRAPH
      +
A* / DIJKSTRA
      +
PRIORITY QUEUE
      +
AMBULANCE ALLOCATION
      +
SPECIALIST / BED / MEDICINE CONSTRAINTS
      +
SUPABASE REALTIME STATE
      +
EXPLAINABLE AI
      =
INTELLIGENT RURAL DISPATCH

The UI visualizes the decision; the backend and algorithmic engine justify and execute it.

19. Repository

Source Code

The original project repository should remain the canonical source for the submission.

VAHAK AlgorithmX

https://github.com/AdityaGupta27177/VAHAK-AlgorithmX

20. Team / Submission Information

Use this section as the final project identity block for the hackathon submission.

Project

VAHAK AlgorithmX

Platform

VAHAK 3D Command Center

Demo Network

Dharnai Rural Health Network • Jehanabad, Bihar (NH-83)

Core Technologies

React
Vite
Supabase
PostgreSQL
Google Maps Platform
A*
Dijkstra
Priority Queue
AI API
Realtime Data
3D Visualization

Required Collaborators

Twentrix
AyushRBuilds
InvictusMF

<div align="center">

🚑 VAHAK 3D COMMAND CENTER

Intelligent Rural Healthcare Dispatch & Routing

Urgency • Algorithms • Real Roads • Resources • Realtime Intelligence

DHARNAI RURAL HEALTH NETWORK • JEHANABAD, BIHAR (NH-83)

</div>
