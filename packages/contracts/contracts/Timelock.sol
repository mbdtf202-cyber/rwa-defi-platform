// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Timelock
 * @notice Timelock contract for delayed execution of administrative operations
 * @dev Implements a queue-based timelock mechanism with role-based access control
 */
contract Timelock is AccessControl, ReentrancyGuard {
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    bytes32 public constant CANCELLER_ROLE = keccak256("CANCELLER_ROLE");

    uint256 public constant MINIMUM_DELAY = 1 days;
    uint256 public constant MAXIMUM_DELAY = 30 days;
    uint256 public delay;

    enum OperationState {
        Unset,
        Pending,
        Ready,
        Executed,
        Cancelled
    }

    struct Operation {
        address target;
        uint256 value;
        bytes data;
        bytes32 predecessor;
        bytes32 salt;
        uint256 timestamp;
        OperationState state;
    }

    mapping(bytes32 => Operation) public operations;

    event OperationScheduled(
        bytes32 indexed id,
        address indexed target,
        uint256 value,
        bytes data,
        bytes32 predecessor,
        bytes32 salt,
        uint256 delay
    );

    event OperationExecuted(bytes32 indexed id, address indexed target, uint256 value, bytes data);
    event OperationCancelled(bytes32 indexed id);
    event DelayChanged(uint256 oldDelay, uint256 newDelay);

    constructor(uint256 _delay, address[] memory proposers, address[] memory executors, address admin) {
        require(_delay >= MINIMUM_DELAY && _delay <= MAXIMUM_DELAY, "Timelock: invalid delay");
        delay = _delay;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);

        for (uint256 i = 0; i < proposers.length; i++) {
            _grantRole(PROPOSER_ROLE, proposers[i]);
        }

        for (uint256 i = 0; i < executors.length; i++) {
            _grantRole(EXECUTOR_ROLE, executors[i]);
        }

        _grantRole(CANCELLER_ROLE, admin);
    }

    /**
     * @notice Schedule an operation for execution after the delay period
     * @param target The target contract address
     * @param value The amount of ETH to send
     * @param data The calldata to execute
     * @param predecessor The operation that must be executed before this one (or bytes32(0))
     * @param salt A unique salt for operation identification
     */
    function schedule(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) external onlyRole(PROPOSER_ROLE) returns (bytes32) {
        bytes32 id = hashOperation(target, value, data, predecessor, salt);
        require(operations[id].state == OperationState.Unset, "Timelock: operation already scheduled");

        if (predecessor != bytes32(0)) {
            require(
                operations[predecessor].state == OperationState.Executed,
                "Timelock: predecessor not executed"
            );
        }

        uint256 timestamp = block.timestamp + delay;

        operations[id] = Operation({
            target: target,
            value: value,
            data: data,
            predecessor: predecessor,
            salt: salt,
            timestamp: timestamp,
            state: OperationState.Pending
        });

        emit OperationScheduled(id, target, value, data, predecessor, salt, delay);

        return id;
    }

    /**
     * @notice Execute a scheduled operation after the delay has passed
     * @param target The target contract address
     * @param value The amount of ETH to send
     * @param data The calldata to execute
     * @param predecessor The predecessor operation
     * @param salt The salt used when scheduling
     */
    function execute(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) external payable onlyRole(EXECUTOR_ROLE) nonReentrant {
        bytes32 id = hashOperation(target, value, data, predecessor, salt);
        Operation storage operation = operations[id];

        require(operation.state == OperationState.Pending, "Timelock: operation not pending");
        require(block.timestamp >= operation.timestamp, "Timelock: operation not ready");

        operation.state = OperationState.Executed;

        (bool success, bytes memory returndata) = target.call{value: value}(data);
        require(success, string(returndata));

        emit OperationExecuted(id, target, value, data);
    }

    /**
     * @notice Cancel a scheduled operation
     * @param id The operation ID to cancel
     */
    function cancel(bytes32 id) external onlyRole(CANCELLER_ROLE) {
        Operation storage operation = operations[id];
        require(operation.state == OperationState.Pending, "Timelock: operation not pending");

        operation.state = OperationState.Cancelled;

        emit OperationCancelled(id);
    }

    /**
     * @notice Update the delay period
     * @param newDelay The new delay in seconds
     */
    function updateDelay(uint256 newDelay) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newDelay >= MINIMUM_DELAY && newDelay <= MAXIMUM_DELAY, "Timelock: invalid delay");
        uint256 oldDelay = delay;
        delay = newDelay;
        emit DelayChanged(oldDelay, newDelay);
    }

    /**
     * @notice Hash an operation to get its ID
     */
    function hashOperation(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(target, value, data, predecessor, salt));
    }

    /**
     * @notice Check if an operation is pending
     */
    function isOperationPending(bytes32 id) public view returns (bool) {
        return operations[id].state == OperationState.Pending;
    }

    /**
     * @notice Check if an operation is ready for execution
     */
    function isOperationReady(bytes32 id) public view returns (bool) {
        Operation memory operation = operations[id];
        return operation.state == OperationState.Pending && block.timestamp >= operation.timestamp;
    }

    /**
     * @notice Check if an operation has been executed
     */
    function isOperationExecuted(bytes32 id) public view returns (bool) {
        return operations[id].state == OperationState.Executed;
    }

    /**
     * @notice Get the timestamp when an operation becomes ready
     */
    function getTimestamp(bytes32 id) public view returns (uint256) {
        return operations[id].timestamp;
    }

    receive() external payable {}
}
